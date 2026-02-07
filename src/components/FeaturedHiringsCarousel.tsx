import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { storage } from '../utils/storage';

interface CarouselSlide {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  link?: string;
}

const FeaturedHiringsCarousel: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [slides, setSlides] = useState<CarouselSlide[]>([]);

  useEffect(() => {
    // Load promotional data from storage
    const promotionalData = storage.getPromotionalData();
    
    const carouselSlides: CarouselSlide[] = [
      {
        id: '1',
        image: promotionalData.techMahindra?.image || 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1200',
        title: 'Tech Mahindra Hiring',
        subtitle: promotionalData.techMahindra?.text || 'Join our team today!',
        link: '/questions?company=Tech Mahindra'
      },
      {
        id: '2',
        image: promotionalData.tcs?.image || 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=1200',
        title: 'TCS Opportunities',
        subtitle: promotionalData.tcs?.text || 'Start your career with us!',
        link: '/questions?company=TCS'
      },
      {
        id: '3',
        image: promotionalData.wipro?.image || 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1200',
        title: 'Wipro Careers',
        subtitle: promotionalData.wipro?.text || 'Grow with innovation!',
        link: '/questions?company=Wipro'
      },
      {
        id: '4',
        image: promotionalData.infosys?.image || 'https://images.pexels.com/photos/3184639/pexels-photo-3184639.jpeg?auto=compress&cs=tinysrgb&w=1200',
        title: 'Infosys Hiring',
        subtitle: promotionalData.infosys?.text || 'Build your future!',
        link: '/questions?company=Infosys'
      }
    ];

    setSlides(carouselSlides);
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying && !isHovered && slides.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [isAutoPlaying, isHovered, slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  if (slides.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-200 rounded-2xl flex items-center justify-center">
        <p className="text-gray-500">Loading promotional content...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Main Carousel Container */}
      <div 
        className="relative overflow-hidden rounded-2xl shadow-2xl bg-gray-900"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Carousel Track */}
        <div 
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div key={slide.id} className="w-full flex-shrink-0 relative">
              {/* Main Image */}
              <div className="relative h-64 sm:h-80 md:h-96 lg:h-[500px]">
                <img 
                  src={slide.image} 
                  alt={slide.title}
                  className="w-full h-full object-cover"
                  loading={index === 0 ? "eager" : "lazy"}
                />
                
                {/* Gradient Overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                
                {/* Text Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 md:p-12">
                  <div className="max-w-4xl">
                    <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-4 drop-shadow-lg">
                      {slide.title}
                    </h3>
                    {slide.subtitle && (
                      <p className="text-lg sm:text-xl md:text-2xl text-white/90 drop-shadow-lg">
                        {slide.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white p-2 sm:p-3 rounded-full transition-all duration-300 hover:scale-110"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white p-2 sm:p-3 rounded-full transition-all duration-300 hover:scale-110"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        {/* Auto-play Control */}
        <button
          onClick={toggleAutoPlay}
          className="absolute bottom-4 right-4 z-30 bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white p-2 sm:p-3 rounded-full transition-all duration-300 hover:scale-110"
          aria-label={isAutoPlaying ? "Pause slideshow" : "Play slideshow"}
        >
          {isAutoPlaying ? (
            <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
          ) : (
            <Play className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </button>
      </div>

      {/* Slide Indicators */}
      <div className="flex justify-center space-x-2 sm:space-x-3 mt-4 sm:mt-6">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 sm:h-3 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-blue-600 w-6 sm:w-8' 
                : 'bg-gray-300 hover:bg-gray-400 w-2 sm:w-3'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mt-2 sm:mt-4 bg-gray-200 rounded-full h-1 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-blue-500 to-purple-600 h-full transition-all duration-700 ease-out"
          style={{ 
            width: `${((currentSlide + 1) / slides.length) * 100}%` 
          }}
        />
      </div>
    </div>
  );
};

export default FeaturedHiringsCarousel;