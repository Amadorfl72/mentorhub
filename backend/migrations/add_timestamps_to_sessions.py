"""
Migración para añadir campos de timestamp a la tabla mentorship_sessions
"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# Revisión: reemplaza con un identificador único
revision = 'add_timestamps_to_sessions'
down_revision = None  # Reemplaza con la revisión anterior si existe

def upgrade():
    # Añadir columnas con un valor predeterminado para los registros existentes
    op.add_column('mentorship_sessions', 
                 sa.Column('created_at', sa.DateTime, 
                          nullable=False, 
                          server_default=sa.text('CURRENT_TIMESTAMP')))
    op.add_column('mentorship_sessions', 
                 sa.Column('updated_at', sa.DateTime, 
                          nullable=False, 
                          server_default=sa.text('CURRENT_TIMESTAMP')))

def downgrade():
    # Eliminar columnas en caso de rollback
    op.drop_column('mentorship_sessions', 'updated_at')
    op.drop_column('mentorship_sessions', 'created_at') 