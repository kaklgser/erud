import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const MyWebinarsPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/my-bookings', { replace: true });
  }, [navigate]);

  return null;
};
