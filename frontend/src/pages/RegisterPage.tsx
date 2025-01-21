import React, { useState } from 'react';
import { Button, TextInput, Textarea, Select, Card } from 'flowbite-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: '',
    biography: '',
    expertise: '',
    photoUrl: user?.photoUrl || ''
  });
  const [keywords, setKeywords] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5001/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          keywords
        }),
      });

      if (response.ok) {
        const data = await response.json();
        login(data);
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const handleKeywordInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value) {
      setKeywords([...keywords, e.currentTarget.value]);
      e.currentTarget.value = '';
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Complete Your Profile</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <TextInput
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          
          <div>
            <Select
              required
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
              <option value="">Select Role</option>
              <option value="mentor">Mentor</option>
              <option value="mentee">Mentee</option>
            </Select>
          </div>

          <div>
            <Textarea
              placeholder="Tell us about yourself..."
              rows={4}
              value={formData.biography}
              onChange={(e) => setFormData({...formData, biography: e.target.value})}
              required
            />
          </div>

          <div>
            <TextInput
              type="text"
              placeholder="Add keywords (press Enter)"
              onKeyPress={handleKeywordInput}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                >
                  {keyword}
                  <button
                    type="button"
                    onClick={() => setKeywords(keywords.filter((_, i) => i !== index))}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full">
            Complete Registration
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default RegisterPage; 