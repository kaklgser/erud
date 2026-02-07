import React, { useState, useEffect } from 'react';
import { BookOpen, Download, ExternalLink } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Material } from '../types';
import { supabaseStorage } from '../utils/supabaseStorage';
import LoadingSpinner from '../components/LoadingSpinner';
import { AnimatedCard, FloatingParticles, ChristmasSnow } from '../components/ui';

const MaterialsPage: React.FC = () => {
  const { isChristmasMode, colors } = useTheme();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const allMaterials = await supabaseStorage.getMaterials();
      setMaterials(allMaterials);
    } catch (error) {
      console.error('Error loading materials:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner message="Loading study materials..." size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Free Learning Materials
          </h1>
          <p className="text-gray-600">
            Access free study materials, guides, and resources to boost your interview preparation
          </p>
        </div>

        {materials.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No materials available</h3>
            <p className="mt-1 text-sm text-gray-500">
              Check back later for new learning materials
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.map((material) => (
              <div key={material.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <img
                  src={material.imageUrl}
                  alt={material.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {material.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {material.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {new Date(material.uploadedAt).toLocaleDateString()}
                    </span>
                    <div className="flex space-x-2">
                      <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors">
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </button>
                      <button className="flex items-center space-x-1 text-green-600 hover:text-green-700 transition-colors">
                        <ExternalLink className="h-4 w-4" />
                        <span>View</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Additional Resources */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Additional Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Interview Preparation Tips
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Research the company thoroughly</li>
                <li>• Practice common interview questions</li>
                <li>• Prepare your own questions to ask</li>
                <li>• Review technical concepts</li>
                <li>• Practice coding problems</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Coding Best Practices
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Write clean, readable code</li>
                <li>• Think about edge cases</li>
                <li>• Explain your approach</li>
                <li>• Test your solution</li>
                <li>• Optimize for time and space</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialsPage;