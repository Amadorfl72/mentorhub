import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import {
  Avatar,
  Button,
  Dropdown,
  Card,
  Toast,
  Modal,
  Label,
  Pagination,
} from "flowbite-react";
import {
  HiMenuAlt1,
  HiOutlineLogout,
  HiOutlineUser,
  HiOutlineCog,
  HiPlus,
  HiViewList,
  HiCheck,
  HiX,
  HiExclamation,
  HiCalendar,
  HiUsers,
  HiDuplicate,
} from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import UserMenu from "../components/UserMenu";
import LanguageSelector from "../components/LanguageSelector";
import ThemeSwitch from "../components/ThemeSwitch";
import {
  getMentorSessions,
  getAllSessions,
  deleteSession,
  Session,
  getApprenticeSessions,
  unenrollMentee,
  enrollMentee,
  duplicateSession,
} from "../services/sessionService";
import { fetchData } from "../services/apiService";
import CachedImage from "../components/CachedImage";
import { apiGet, testToken } from "../services/api";
import { User } from "../context/AuthContext";
import Linkify from "react-linkify";

interface NotificationState {
  show: boolean;
  message: string;
  type: "success" | "error";
}

// Interfaz para la información de mentor/mentee
interface MentorInfo {
  id: number;
  name: string;
  email: string;
  photoUrl?: string;
  photoData?: string;
  role: string;
}

// Interfaz para sesiones enriquecidas con información de usuario
interface EnrichedSession extends Omit<Session, "mentees"> {
  mentor: MentorInfo | null;
  // mentees puede ser tanto array de IDs (números) como array de Users
  mentees: number[] | User[];
}

// Añadir esta función para truncar la descripción
const truncateDescription = (description: string, maxLength: number = 100) => {
  if (description.length <= maxLength) {
    return description;
  }
  
  // Expresión regular para detectar URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  // Encontrar todas las URLs en el texto
  let match;
  const urls: { index: number; length: number }[] = [];
  
  while ((match = urlRegex.exec(description)) !== null) {
    urls.push({
      index: match.index,
      length: match[0].length
    });
  }
  
  // Si no hay URLs, truncar normalmente
  if (urls.length === 0) {
    return description.substring(0, maxLength).trim();
  }
  
  // Comprobar si alguna URL cruza el punto de truncamiento
  for (const url of urls) {
    const urlStart = url.index;
    const urlEnd = urlStart + url.length;
    
    // Si la URL cruza el punto de truncamiento
    if (urlStart < maxLength && urlEnd > maxLength) {
      // Opción 1: Truncar antes de la URL
      if (urlStart > 15) { // Asegurar que hay suficiente texto antes
        return description.substring(0, urlStart).trim();
      }
      // Opción 2: Incluir la URL completa y truncar después
      else if (urlEnd < maxLength + 50) { // No extender demasiado
        return description.substring(0, urlEnd).trim();
      }
      // Si la URL es muy larga, truncar en el punto original
      else {
        return description.substring(0, maxLength).trim();
      }
    }
  }
  
  // Si no hay problemas con URLs, truncar normalmente
  return description.substring(0, maxLength).trim();
};

// Función para verificar si una sesión ya ha pasado (mover esta función antes de loadSessions)
const isSessionPast = (scheduledTime: string): boolean => {
  const sessionDate = new Date(scheduledTime).getTime();
  const now = new Date().getTime();
  return sessionDate < now;
};

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Añadir estado para las estadísticas
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMentors: 0,
    totalMentees: 0,
    totalSessions: 0,
    sessionsThisWeek: 0,
  });

  const [sessions, setSessions] = useState<EnrichedSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<EnrichedSession[]>(
    [],
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [showPastSessions, setShowPastSessions] = useState<boolean>(false);
  // Añadir estado para filtrar el tipo de sesiones
  const [sessionFilter, setSessionFilter] = useState<
    "all" | "mentor" | "mentee"
  >("all");
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: "",
    type: "success",
  });

  // Estado para almacenar información de mentores
  const [mentors, setMentors] = useState<Record<number, MentorInfo>>({});

  // Nuevo estado para el modal de confirmación de borrado
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    sessionId: number | null;
  }>({
    show: false,
    sessionId: null,
  });

  // Añadir un nuevo estado para las próximas sesiones
  const [upcomingSessions, setUpcomingSessions] = useState<EnrichedSession[]>(
    [],
  );

  // Añadir estos estados para manejar la paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Limitado a 6 registros por página

  // Añadir este estado para mantener un registro de las sesiones en las que el usuario está inscrito como mentee
  const [userMenteeSessionIds, setUserMenteeSessionIds] = useState<Set<number>>(
    new Set(),
  );

  // Añadir un estado para almacenar la información de usuarios
  const [userInfoMap, setUserInfoMap] = useState<Map<number, MentorInfo>>(
    new Map(),
  );

  // Agregar estado para el modal de confirmación de desinscripción
  const [unenrolModal, setUnenrolModal] = useState<{
    show: boolean;
    sessionId: number | null;
    sessionTitle: string;
  }>({
    show: false,
    sessionId: null,
    sessionTitle: "",
  });

  // Añadir estado para indicar que está duplicando una sesión
  const [isDuplicating, setIsDuplicating] = useState<boolean>(false);

  // Función para obtener información básica del usuario
  const getUserInfo = useCallback(
    async (userId: number): Promise<MentorInfo | null> => {
      try {
        const userData = await apiGet(`/users/${userId}`);

        return {
          id: userData.id,
          name: userData.username || userData.name,
          email: userData.email,
          photoUrl: userData.photoUrl,
          photoData: userData.photo_data,
          role: userData.role,
        };
      } catch (error) {
        console.error(`Error fetching user info for ID ${userId}:`, error);
        return null;
      }
    },
    [],
  );

  // Definir la función loadSessions con useCallback para evitar recreaciones innecesarias
  const loadSessions = useCallback(async () => {
    if (!user) {
      console.warn('No user data, cannot load sessions');
      return;
    }

    try {
      setLoading(true);

      // Obtener todas las sesiones para la sección "Upcoming Sessions"
      const allSessionsData = await getAllSessions();
      // console.log("Todas las sesiones:", allSessionsData);

      // Obtener las sesiones del usuario (como mentor)
      const userMentorSessionsData = await getMentorSessions();
      // console.log("Sesiones como mentor:", userMentorSessionsData);

      // Obtener las sesiones del usuario (como mentee)
      const userMenteeSessionsData = await getApprenticeSessions();
      // console.log("Sesiones como mentee:", userMenteeSessionsData);

      // Guardar los IDs de las sesiones del usuario como mentee para uso en isUserEnrolled
      const menteeSessionIds = new Set(
        userMenteeSessionsData
          .map((session) => session.id)
          .filter(Boolean) as number[],
      );
      setUserMenteeSessionIds(menteeSessionIds);

      // Crear un mapa combinado para todas las sesiones
      // Esto nos permitirá tener la información completa de mentees
      const allSessionsMap = new Map<number, Session>();

      // Añadir todas las sesiones al mapa
      allSessionsData.forEach((session) => {
        if (session.id) {
          allSessionsMap.set(session.id, session);
        }
      });

      // Combinar ambas listas de sesiones (eliminando duplicados por ID)
      const userSessionMap = new Map<number, Session>();

      // Primero añadir las sesiones como mentor
      userMentorSessionsData.forEach((session) => {
        if (session.id) {
          // Obtener la sesión del mapa global si existe (tendrá la lista completa de mentees)
          const completeSession = allSessionsMap.get(session.id) || session;
          userSessionMap.set(session.id, completeSession);
        }
      });

      // Luego añadir las sesiones como mentee (si no existen ya)
      userMenteeSessionsData.forEach((session) => {
        if (session.id) {
          // Obtener la sesión del mapa global si existe (tendrá la lista completa de mentees)
          const completeSession = allSessionsMap.get(session.id) || session;
          userSessionMap.set(session.id, completeSession);
        }
      });

      // Convertir el mapa a un array
      const userSessionsData = Array.from(userSessionMap.values());

      // Procesar las sesiones del usuario
      if (userSessionsData.length > 0) {
        // Obtener IDs únicos de usuarios (mentores y mentees)
        const userIdsSet: Record<number, boolean> = {};
        userSessionsData.forEach((session) => {
          if (session.mentor_id) {
            userIdsSet[session.mentor_id] = true;
          }

          // Si la sesión tiene mentees, añadirlos también
          if (session.mentees && Array.isArray(session.mentees)) {
            session.mentees.forEach((mentee) => {
              if (mentee.id) {
                userIdsSet[Number(mentee.id)] = true;
              }
            });
          } else if (session.mentees && !Array.isArray(session.mentees)) {
            // En el caso de que mentees no sea un array sino un array de IDs
            // Esto pasa con las sesiones del mentor
            const menteeIds = session.mentees as unknown as number[];
            menteeIds.forEach((menteeId) => {
              userIdsSet[menteeId] = true;
            });
          }
        });

        // Asegurarse de que el usuario actual está en la lista de IDs
        if (user.id) {
          userIdsSet[Number(user.id)] = true;
        }

        const userIds = Object.keys(userIdsSet).map((id) => parseInt(id));

        // Obtener información de todos los usuarios en paralelo
        const usersInfo = await Promise.all(
          userIds.map((id) => getUserInfo(id)),
        );

        // Crear un mapa de ID de usuario a información de usuario
        const userInfoMap = new Map<number, MentorInfo>();
        usersInfo.forEach((info) => {
          if (info) {
            userInfoMap.set(info.id, info);
          }
        });

        // Guardar el mapa de información de usuarios en el estado
        setUserInfoMap(userInfoMap);

        // Asegurarse de que el usuario actual está en el mapa de información
        if (user.id) {
          if (!userInfoMap.has(Number(user.id))) {
            userInfoMap.set(Number(user.id), {
              id: Number(user.id),
              name: user.name || "",
              email: user.email || "",
              photoUrl: user.photoUrl || "",
              photoData: user.photoData || "",
              role: user.role || "mentee",
            });
          }
        }

        // Enriquecer las sesiones del usuario con información de usuario
        const enrichedUserSessions = userSessionsData.map((session) => {
          // No transformar el campo mentees, mantenerlo como array de IDs como viene del backend
          return {
            ...session,
            mentor: session.mentor_id
              ? userInfoMap.get(session.mentor_id) || null
              : null,
            // Mantener el mismo formato para mentees en todas las sesiones
            mentees: session.mentees || [],
          } as EnrichedSession;
        });

        setSessions(enrichedUserSessions);
      } else {
        setSessions([]);
      }

      // Procesar todas las sesiones para la sección "Upcoming Sessions"
      if (allSessionsData.length > 0) {
        // Obtener IDs únicos de mentores
        const mentorIdsSet: Record<number, boolean> = {};
        allSessionsData.forEach((session) => {
          if (session.mentor_id) {
            mentorIdsSet[session.mentor_id] = true;
          }
        });

        const mentorIds = Object.keys(mentorIdsSet).map((id) => parseInt(id));

        // Obtener información de todos los mentores en paralelo
        const mentorsInfo = await Promise.all(
          mentorIds.map((id) => getUserInfo(id)),
        );

        // Crear un mapa de ID de mentor a información de mentor
        const mentorInfoMap = new Map<number, MentorInfo>();
        mentorsInfo.forEach((info) => {
          if (info) {
            mentorInfoMap.set(info.id, info);
          }
        });

        // Enriquecer todas las sesiones con información de mentor
        const enrichedAllSessions = allSessionsData.map((session) => {
          return {
            ...session,
            mentor: session.mentor_id
              ? mentorInfoMap.get(session.mentor_id) || null
              : null,
            // No añadimos mentees aquí porque no son necesarios para la sección "Upcoming Sessions"
            mentees: session.mentees || []
          } as EnrichedSession;
        });

        // Filtrar solo las sesiones futuras y ordenarlas por fecha
        const upcoming = enrichedAllSessions
          .filter(session => !isSessionPast(session.scheduled_time))
          .sort((a, b) => {
            const dateA = new Date(a.scheduled_time).getTime();
            const dateB = new Date(b.scheduled_time).getTime();
            return dateA - dateB;
          })
          .slice(0, 3); // Limitar a 3 sesiones próximas

        setUpcomingSessions(upcoming);
      } else {
        setUpcomingSessions([]);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading sessions:", error);
      setLoading(false);
      setSessions([]);
      setUpcomingSessions([]);
    }
  }, [user, getUserInfo]);

  // Efecto para verificar autenticación y cargar sesiones
  useEffect(() => {
    // Verificar si el usuario está autenticado
    if (!user) {
      console.error("No user data found. Redirecting to login...");
      navigate("/login");
      return;
    }

    // Cargar las sesiones una sola vez al montar el componente
    loadSessions();

    // No incluimos loadSessions en las dependencias para evitar ciclos infinitos
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  // Mantener solo el efecto que obtiene las estadísticas de la API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:5001/api/stats", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Mapear los nombres de las propiedades del backend a los nombres que usa el frontend
        setStats({
          totalUsers: data.total_users || 0,
          totalMentors: data.total_mentors || 0,
          totalMentees: data.total_mentees || 0,
          totalSessions: data.total_sessions || 0,
          sessionsThisWeek: data.sessions_this_week || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);

  // Simplificar el useEffect que filtra las sesiones
  useEffect(() => {
    let filtered = [...sessions];

    // Filtrar por sesiones pasadas si es necesario
    if (!showPastSessions) {
      filtered = filtered.filter(
        (session) => !isSessionPast(session.scheduled_time),
      );
    }

    // Filtrar por tipo de rol (mentor o mentee)
    if (sessionFilter !== "all" && user?.id) {
      const userId = Number(user.id);

      if (sessionFilter === "mentor") {
        // Mostrar solo sesiones donde el usuario es mentor
        filtered = filtered.filter((session) => session.mentor_id === userId);
      } else if (sessionFilter === "mentee") {
        // Mostrar solo sesiones donde el usuario es mentee (está inscrito)
        filtered = filtered.filter((session) => {
          // Comprobar si el ID de la sesión está en userMenteeSessionIds
          if (session.id && userMenteeSessionIds.has(session.id)) {
            return true;
          }

          // Comprobar si el usuario está en la lista de mentees
          if (session.mentees && session.mentees.length > 0) {
            return session.mentees.some((mentee) => {
              if (typeof mentee === "object" && "id" in mentee) {
                return Number(mentee.id) === userId;
              }
              return Number(mentee) === userId;
            });
          }

          return false;
        });
      }
    }

    setFilteredSessions(filtered);

    // Resetear a la primera página cuando cambian los filtros
    setCurrentPage(1);
  }, [
    showPastSessions,
    sessions,
    sessionFilter,
    user?.id,
    userMenteeSessionIds,
  ]);

  // Añadir este nuevo useEffect para las sesiones próximas
  useEffect(() => {
    // Filtrar solo las sesiones futuras y ordenarlas por fecha
    const upcoming = sessions
      .filter((session) => !isSessionPast(session.scheduled_time))
      .sort((a, b) => {
        const dateA = new Date(a.scheduled_time).getTime();
        const dateB = new Date(b.scheduled_time).getTime();
        return dateA - dateB;
      })
      .slice(0, 3); // Limitar a 3 sesiones próximas

    setUpcomingSessions(upcoming);
  }, [sessions]);

  // Función para obtener las sesiones de la página actual
  const getCurrentPageSessions = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredSessions.slice(startIndex, endIndex);
  };

  // Función para manejar el cambio de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleLogout = () => {
    logout();
  };

  const handleEditProfile = () => {
    navigate("/register", { state: { isNewUser: false } });
  };

  const showNotification = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "success" });
    }, 3000);
  };

  // Función para mostrar el modal de confirmación de borrado
  const confirmDelete = (sessionId: number) => {
    setDeleteModal({
      show: true,
      sessionId,
    });
  };

  // Función para cancelar el borrado
  const cancelDelete = () => {
    setDeleteModal({
      show: false,
      sessionId: null,
    });
  };

  // Función para ejecutar el borrado
  const handleDelete = async () => {
    if (!deleteModal.sessionId) return;

    setLoading(true);
    try {
      await deleteSession(deleteModal.sessionId);

      // Actualizar la lista de sesiones manteniendo el orden
      const updatedSessions = sessions
        .filter((session) => session.id !== deleteModal.sessionId)
        .sort((a, b) => {
          const dateA = new Date(a.scheduled_time).getTime();
          const dateB = new Date(b.scheduled_time).getTime();
          return dateA - dateB;
        });

      setSessions(updatedSessions);

      // Mostrar notificación de éxito
      showNotification(t("sessions.delete_success"), "success");
    } catch (error) {
      console.error("Error al eliminar la sesión:", error);
      showNotification(t("sessions.delete_error"), "error");
    } finally {
      setLoading(false);
      cancelDelete();
    }
  };

  // Función para formatear la fecha y hora de manera más compacta
  const formatDateTime = (dateTimeString: string): string => {
    const date = new Date(dateTimeString);
    // Formato más compacto: DD/MM HH:MM
    return (
      date.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "2-digit",
      }) +
      " " +
      date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  // Componente de paginación personalizado para tema oscuro
  const CustomPagination = ({
    currentPage,
    totalPages,
  }: {
    currentPage: number;
    totalPages: number;
  }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center my-4">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          showIcons={true}
          layout="pagination"
          theme={{
            base: "",
            layout: {
              table: {
                base: "text-sm text-gray-300",
              },
            },
            pages: {
              base: "xs:mt-0 mt-2 inline-flex items-center -space-x-px",
              showIcon: "inline-flex",
              previous: {
                base: "ml-0 rounded-l-lg border border-gray-700 bg-gray-800 py-2 px-3 leading-tight text-gray-400 hover:bg-gray-700 hover:text-white",
                icon: "h-5 w-5",
              },
              next: {
                base: "rounded-r-lg border border-gray-700 bg-gray-800 py-2 px-3 leading-tight text-gray-400 hover:bg-gray-700 hover:text-white",
                icon: "h-5 w-5",
              },
              selector: {
                base: "w-12 border border-gray-700 bg-gray-800 py-2 leading-tight text-gray-400 hover:bg-gray-700 hover:text-white",
                active:
                  "bg-gray-700 text-white hover:bg-gray-600 hover:text-white",
                disabled: "opacity-50 cursor-not-allowed",
              },
            },
          }}
        />
      </div>
    );
  };

  // Función para manejar la inscripción a una sesión
  const handleEnrol = async (sessionId: number) => {
    try {
      setLoading(true);

      // Verificar que el usuario exista
      if (!user || !user.id) {
        throw new Error("Usuario no autenticado");
      }

      const userId = Number(user.id);

      // Llamar al servicio para inscribir al usuario
      await enrollMentee(sessionId, userId);

      // Actualizar el conjunto de IDs de sesiones del usuario como mentee
      setUserMenteeSessionIds((prev) => {
        const newSet = new Set(Array.from(prev));
        newSet.add(sessionId);
        return newSet;
      });

      // Mostrar notificación de éxito
      showNotification(t("sessions.enrol_success"), "success");

      // Recargar las sesiones para obtener datos actualizados
      // Esto es importante para asegurar que todos los datos estén sincronizados
      loadSessions();

      // console.log('User enrolled successfully in session:', sessionId);
    } catch (error) {
      console.error("Error al inscribirse en la sesión:", error);
      showNotification(t("sessions.enrol_error"), "error");
    } finally {
      setLoading(false);
    }
  };

  // Añadir una función para verificar si el usuario está inscrito en la sesión
  const isUserEnrolled = (session: EnrichedSession): boolean => {
    if (!user || !user.id) {
      return false;
    }

    const userId = Number(user.id);

    // Verificar primero si el ID de la sesión está en el conjunto de sesiones del mentee
    if (session.id && userMenteeSessionIds.has(session.id)) {
      return true;
    }

    // Verificar si la sesión tiene mentees y si el usuario actual está entre ellos
    if (session.mentees && session.mentees.length > 0) {
      return session.mentees.some((mentee) => {
        if (typeof mentee === "object" && "id" in mentee) {
          return Number(mentee.id) === userId;
        }
        return Number(mentee) === userId;
      });
    }

    return false;
  };

  // Función para mostrar el modal de confirmación de desinscripción
  const confirmUnenrol = (sessionId: number) => {
    // Encontrar la sesión por ID
    const session = [...sessions].find((s) => s.id === sessionId);
    if (!session) return;

    setUnenrolModal({
      show: true,
      sessionId,
      sessionTitle: session.title,
    });
  };

  // Función para cancelar la desinscripción
  const cancelUnenrol = () => {
    setUnenrolModal({
      show: false,
      sessionId: null,
      sessionTitle: "",
    });
  };

  // Actualizar la función handleUnenrol para que se ejecute después de confirmar
  const handleUnenrol = async () => {
    const sessionId = unenrolModal.sessionId;
    if (!sessionId) return;

    try {
      setLoading(true);
      // Obtener el ID del usuario actual
      if (!user?.id) {
        throw new Error("Usuario no autenticado");
      }

      const userId = Number(user.id);

      // Llamar al servicio para desuscribir al usuario
      await unenrollMentee(sessionId, userId);

      // Eliminar la ID de sesión del conjunto de sesiones del usuario como mentee
      setUserMenteeSessionIds((prev) => {
        const newSet = new Set(Array.from(prev));
        newSet.delete(sessionId);
        return newSet;
      });

      // Mostrar notificación de éxito
      showNotification(t("sessions.unenrol_success"), "success");

      // Recargar las sesiones para actualizar los datos
      loadSessions();

      // console.log('User unenrolled successfully from session:', sessionId);
    } catch (error) {
      console.error("Error al desuscribirse de la sesión:", error);
      showNotification(t("sessions.unenrol_error"), "error");
    } finally {
      setLoading(false);
      // Cerrar el modal
      cancelUnenrol();
    }
  };

  // Función para manejar la duplicación de sesiones
  const handleDuplicate = async (sessionId: number) => {
    if (isDuplicating) return;
    
    setIsDuplicating(true);
    try {
      // Llamar al servicio para duplicar la sesión
      const duplicatedSession = await duplicateSession(sessionId);
      
      // Mostrar notificación de éxito
      showNotification(t("sessions.duplicate_success"), "success");
      
      // Navegar a la página de edición de la sesión duplicada con el parámetro edit=true y fromDuplicate=true
      navigate(`/session/${duplicatedSession.id}?edit=true&fromDuplicate=true`);
    } catch (error) {
      console.error("Error al duplicar la sesión:", error);
      showNotification(t("sessions.duplicate_error"), "error");
      setIsDuplicating(false);
    }
  };

  // Si el usuario es 'pending', no renderizar el dashboard
  if (user?.role === "pending") {
    return null;
  }

  // Asegurarse de que getCurrentPageSessions se llama correctamente en el renderizado
  const paginatedSessions = getCurrentPageSessions();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navbar */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">
                {t("dashboard.title")}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeSwitch />
              <LanguageSelector />
              <UserMenu />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
          {/* Primer Card - Quick Actions (más estrecho) */}
          <Card className="bg-gray-800 lg:col-span-3">
            <h5 className="text-lg font-bold tracking-tight text-white mb-2">
              {t("dashboard.quick_actions")}
            </h5>
            <div className="flex flex-col space-y-2">
              {(user?.role === "mentor" || user?.role === "both") && (
                <Button
                  color="blue"
                  size="sm"
                  onClick={() => navigate("/session/new")}
                >
                  <HiPlus className="mr-2 h-4 w-4" />
                  {t("sessions.new_session")}
                </Button>
              )}

              {/* Volver a añadir el botón "Ver todas las sesiones" */}
              <Button
                size="sm"
                gradientDuoTone="purpleToBlue"
                className="hover:bg-blue-700"
                onClick={() => navigate("/sessions")}
              >
                {t("dashboard.viewAllSessions")}
              </Button>
            </div>
          </Card>

          {/* Upcoming Sessions Card (más ancho) */}
          <Card className="bg-gray-800 border-gray-700 lg:col-span-5">
            <h2 className="text-lg font-bold text-white mb-2">
              {t("dashboard.upcomingSessions")}
            </h2>

            {/* Lista de próximas sesiones (más compacta) */}
            {upcomingSessions.length > 0 ? (
              <div className="space-y-2">
                {upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => navigate(`/session/${session.id}`)}
                    className="flex items-center py-1.5 px-2 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                  >
                    {/* Alinear fecha y título a la izquierda */}
                    <div className="text-xs text-blue-400 whitespace-nowrap mr-2">
                      {formatDateTime(session.scheduled_time)}
                    </div>
                    <div className="font-medium text-sm text-white truncate flex-grow">
                      {session.title}
                    </div>
                    {/* Mostrar el nombre del mentor */}
                    <div className="text-xs text-gray-400 whitespace-nowrap ml-2">
                      {session.mentor?.name || t("sessions.unknown_mentor")}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-1.5 text-gray-400 text-xs">
                {t("sessions.no_upcoming_sessions")}
              </div>
            )}
          </Card>

          {/* User Stats Card */}
          <Card className="bg-gray-800 border-gray-700 lg:col-span-4">
            <h2 className="text-xl font-bold text-white mb-3">
              {t("dashboard.userStats")}
            </h2>

            {/* Grid de 3 columnas para los KPIs principales */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {/* Total de usuarios */}
              <div className="text-center p-3 bg-gray-700 rounded-lg">
                <div className="text-xl font-bold text-blue-400">
                  {stats.totalUsers}
                </div>
                <div className="text-xs text-gray-400">
                  {t("dashboard.totalUsers")}
                </div>
              </div>

              {/* Total de sesiones */}
              <div className="text-center p-3 bg-gray-700 rounded-lg">
                <div className="text-xl font-bold text-yellow-400">
                  {stats.totalSessions}
                </div>
                <div className="text-xs text-gray-400">
                  {t("dashboard.totalSessions")}
                </div>
              </div>

              {/* Mentores */}
              <div className="text-center p-3 bg-gray-700 rounded-lg">
                <div className="text-xl font-bold text-green-400">
                  {stats.totalMentors}
                </div>
                <div className="text-xs text-gray-400">
                  {t("dashboard.mentors")}
                </div>
              </div>
            </div>

            {/* Añadir el contador de sesiones de esta semana */}
            <div className="p-3 bg-gray-700 rounded-lg text-center">
              <div className="text-lg font-bold text-purple-400">
                {stats.sessionsThisWeek}
              </div>
              <div className="text-xs text-gray-400">
                {t("dashboard.sessionsThisWeek")}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Sección de sesiones */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{t("sessions.mySessions")}</h2>
          <div className="flex items-center gap-4">
            {/* Añadir filtros de forma similar a AllSessionsPage */}
            <div className="flex items-center mb-4 mt-2">
              {/* Switch para mostrar sesiones pasadas */}
              <div className="flex items-center mr-6">
                <Label className="mr-3 text-sm font-medium text-gray-300">
                  {t("sessions.show_past")}
                </Label>
                <div className="inline-flex rounded-lg border border-gray-600">
                  <button
                    type="button"
                    className={`px-3 py-1 text-sm rounded-l-lg ${showPastSessions ? "bg-blue-600 text-white" : "text-gray-300"}`}
                    onClick={() => setShowPastSessions(true)}
                  >
                    {t("common.yes")}
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1 text-sm rounded-r-lg ${!showPastSessions ? "bg-blue-600 text-white" : "text-gray-300"}`}
                    onClick={() => setShowPastSessions(false)}
                  >
                    {t("common.no")}
                  </button>
                </div>
              </div>

              {/* Filtro por tipo de rol */}
              <div className="flex items-center">
                <Label className="mr-3 text-sm font-medium text-gray-300">
                  {t("sessions.view")}
                </Label>
                <div className="inline-flex rounded-lg border border-gray-600">
                  <button
                    type="button"
                    className={`px-3 py-1 text-sm ${sessionFilter === "all" ? "bg-blue-600 text-white" : "text-gray-300"}`}
                    onClick={() => setSessionFilter("all")}
                  >
                    {t("sessions.all")}
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1 text-sm ${sessionFilter === "mentor" ? "bg-blue-600 text-white" : "text-gray-300"}`}
                    onClick={() => setSessionFilter("mentor")}
                  >
                    {t("sessions.as_mentor")}
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1 text-sm ${sessionFilter === "mentee" ? "bg-blue-600 text-white" : "text-gray-300"}`}
                    onClick={() => setSessionFilter("mentee")}
                  >
                    {t("sessions.as_mentee")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Paginación superior */}
        {filteredSessions.length > 0 && (
          <div className="mb-4">
            <CustomPagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredSessions.length / itemsPerPage)}
            />
          </div>
        )}

        {/* Contador de resultados */}
        <div className="mb-4 text-sm text-gray-400">
          {filteredSessions.length > 0
            ? t("sessions.showing_results", {
                from: (currentPage - 1) * itemsPerPage + 1,
                to: Math.min(
                  currentPage * itemsPerPage,
                  filteredSessions.length,
                ),
                total: filteredSessions.length,
              })
            : t("sessions.no_results")}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredSessions.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedSessions.map((session) => {
                const isPast = isSessionPast(session.scheduled_time);

                return (
                  <div
                    key={session.id}
                    className={`bg-gray-800 rounded-lg p-5 shadow h-full flex flex-col ${isPast ? "opacity-70" : ""}`}
                  >
                    {/* Título de la sesión */}
                    <h3 
                      className="text-lg font-bold tracking-tight cursor-pointer hover:underline text-white mb-2"
                      onClick={() => navigate(`/session/${session.id}`)}
                    >
                      {session.title}
                    </h3>

                    <div className="mb-4 flex-grow">
                      <p className="text-gray-300">
                        <Linkify componentDecorator={(decoratedHref: string, decoratedText: string, key: number) => (
                          <a 
                            href={decoratedHref} 
                            key={key} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {decoratedText}
                          </a>
                        )}>
                          {truncateDescription(session.description)}
                        </Linkify>
                        {session.description.length > 100 && (
                          <button
                            onClick={() => navigate(`/session/${session.id}`)}
                            className="text-blue-400 hover:text-blue-300 ml-1 focus:outline-none"
                          >
                            {t("sessions.show_more")}
                          </button>
                        )}
                      </p>
                    </div>

                    {/* Keywords como etiquetas */}
                    {session.keywords && session.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {session.keywords
                          .split(",")
                          .filter(Boolean)
                          .map((keyword) => (
                            <span
                              key={keyword.trim()}
                              className="bg-purple-900 text-purple-100 px-2.5 py-1 text-xs rounded-full"
                            >
                              {keyword.trim()}
                            </span>
                          ))}
                      </div>
                    )}

                    <div className="flex justify-between text-sm text-gray-400 mt-auto mb-4 py-1 border-t border-b border-gray-700">
                      <div className="flex items-center">
                        <HiCalendar className="mr-1.5 h-4 w-4 text-blue-400" />
                        <span>
                          {new Date(
                            session.scheduled_time,
                          ).toLocaleDateString()}{" "}
                          -{" "}
                          {new Date(
                            session.scheduled_time,
                          ).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <HiUsers className="mr-1.5 h-4 w-4 text-green-400" />
                        <span>
                          {Array.isArray(session.mentees)
                            ? session.mentees.length
                            : 0}
                          /{session.max_attendees}
                        </span>
                      </div>
                    </div>

                    {/* Fila inferior con información del mentor y botones */}
                    <div className="mt-2 flex justify-between items-center">
                      {/* Información del mentor */}
                      <div className="flex items-center space-x-2">
                        <CachedImage
                          src={session.mentor?.photoUrl || ""}
                          alt={session.mentor?.name || "Mentor"}
                          className="w-6 h-6 rounded-full"
                          fallbackSrc="/images/default-avatar.svg"
                          userId={session.mentor_id}
                        />
                        <span className="text-sm font-medium">
                          {session.mentor?.name || t("sessions.unknown_mentor")}
                        </span>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex gap-2">
                        {/* Si el usuario es el mentor de la sesión o es admin, mostrar botón de duplicar */}
                        {(session.mentor_id === user?.id || user?.role === "admin") && (
                          <Button
                            size="xs"
                            color="purple"
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                              e.stopPropagation();
                              handleDuplicate(session.id!);
                            }}
                            disabled={loading || isDuplicating}
                            title={t("sessions.duplicate")}
                          >
                            <HiDuplicate className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {/* Si el usuario no es el mentor de la sesión, mostrar botones de inscripción */}
                        {session.mentor_id !== user?.id ? (
                          !isPast ? (
                            isUserEnrolled(session) ? (
                              <Button
                                size="xs"
                                color="warning"
                                onClick={() => confirmUnenrol(session.id!)}
                              >
                                {t("common.unenrol")}
                              </Button>
                            ) : (
                              <Button
                                size="xs"
                                color="success"
                                onClick={() => handleEnrol(session.id!)}
                              >
                                {t("common.enrol")}
                              </Button>
                            )
                          ) : (
                            /* Si la sesión ya pasó, mostrar un badge de "Pasada" */
                            <span className="px-2 py-1 bg-gray-700 text-gray-400 text-xs rounded">
                              {t("sessions.past")}
                            </span>
                          )
                        ) : null}
                      </div>
                    </div>

                    {/* Solo mostrar avatares de asistentes de forma simplificada */}
                    <div className="flex items-center mt-2 pt-2 border-t border-gray-700">
                      <span className="text-xs text-gray-400 mr-2">
                        {t("sessions.attendees")}:
                      </span>
                      <div className="flex -space-x-2">
                        {Array.isArray(session.mentees) &&
                        session.mentees.length > 0 ? (
                          <>
                            {session.mentees
                              .slice(0, 5)
                              .map((mentee, index) => {
                                // Determinar si mentee es un número (ID) o un objeto User
                                const menteeId =
                                  typeof mentee === "object" && mentee.id
                                    ? Number(mentee.id)
                                    : Number(mentee);
                                const menteeInfo = userInfoMap.get(menteeId);

                                // Si es un objeto User, usar sus propiedades directamente
                                const photoUrl =
                                  typeof mentee === "object" && mentee.photoUrl
                                    ? mentee.photoUrl
                                    : menteeInfo?.photoUrl || "";

                                const name =
                                  typeof mentee === "object" && mentee.name
                                    ? mentee.name
                                    : menteeInfo?.name || `User ${menteeId}`;

                                // console.log(`Rendering mentee object: ID=${menteeId}, photo=${photoUrl}`);
                                // console.log(`Rendering mentee ID: ${menteeId}, info=${JSON.stringify(menteeInfo)}`);

                                return (
                                  <CachedImage
                                    key={`${menteeId}-${index}`}
                                    src={photoUrl}
                                    alt={name}
                                    className="w-6 h-6 rounded-full border border-gray-700"
                                    fallbackSrc="/images/default-avatar.svg"
                                    userId={menteeId}
                                  />
                                );
                              })}
                            {session.mentees.length > 5 && (
                              <div className="w-6 h-6 rounded-full bg-gray-600 border border-gray-700 flex items-center justify-center text-xs">
                                +{session.mentees.length - 5}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-gray-500">
                            {t("sessions.no_attendees")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Paginación inferior */}
            <div className="mt-6">
              <CustomPagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredSessions.length / itemsPerPage)}
              />
            </div>
          </>
        ) : (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-400">
              {showPastSessions
                ? t("sessions.no_sessions")
                : t("sessions.no_upcoming_sessions")}
            </p>
            {(user?.role === "mentor" || user?.role === "both") && (
              <Button
                color="blue"
                onClick={() => navigate("/session/new")}
                className="mt-4"
              >
                {t("sessions.create_first_session")}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Modal de confirmación de borrado */}
      <Modal
        show={deleteModal.show}
        size="md"
        popup={true}
        onClose={cancelDelete}
        theme={{
          content: {
            base: "relative h-full w-full p-4 md:h-auto",
            inner: "relative rounded-lg bg-gray-800 shadow dark:bg-gray-800",
          },
        }}
      >
        <Modal.Header
          theme={{
            base: "flex items-start justify-between rounded-t border-b p-5 border-gray-700",
          }}
        />
        <Modal.Body>
          <div className="text-center">
            <HiExclamation className="mx-auto mb-4 h-14 w-14 text-yellow-400" />
            <h3 className="mb-5 text-lg font-normal text-gray-300">
              {t("common.delete_confirmation")}
            </h3>
            <div className="flex justify-center gap-4">
              <Button color="failure" onClick={handleDelete}>
                {t("common.yes")}
              </Button>
              <Button color="gray" onClick={cancelDelete}>
                {t("common.no")}
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      {/* Notificación */}
      {notification.show && (
        <div className="fixed bottom-4 right-4 z-50">
          <Toast>
            <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
              {notification.type === "success" ? (
                <HiCheck className="h-5 w-5 text-green-500" />
              ) : (
                <HiX className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="ml-3 text-sm font-normal">
              {notification.message}
            </div>
            <Toast.Toggle />
          </Toast>
        </div>
      )}

      {/* Modal de confirmación de desinscripción */}
      <Modal
        show={unenrolModal.show}
        size="md"
        popup={true}
        onClose={cancelUnenrol}
        theme={{
          content: {
            base: "relative h-full w-full p-4 md:h-auto",
            inner: "relative rounded-lg bg-gray-800 shadow dark:bg-gray-800",
          },
        }}
      >
        <Modal.Header
          theme={{
            base: "flex items-start justify-between rounded-t border-b p-5 border-gray-700",
          }}
        />
        <Modal.Body>
          <div className="text-center">
            <HiExclamation className="mx-auto mb-4 h-14 w-14 text-yellow-400" />
            <h3 className="mb-5 text-lg font-normal text-gray-300">
              {t("sessions.unenrol_confirmation", {
                title: unenrolModal.sessionTitle,
              })}
            </h3>
            <div className="flex justify-center gap-4">
              <Button color="failure" onClick={handleUnenrol}>
                {t("common.yes")}
              </Button>
              <Button color="gray" onClick={cancelUnenrol}>
                {t("common.no")}
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default DashboardPage;
