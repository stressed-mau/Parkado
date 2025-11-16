// components/ReviewsModal.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { AntDesign, FontAwesome6 } from '@expo/vector-icons';

interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
}

interface ReviewsModalProps {
  visible: boolean;
  onClose: () => void;
}

const ReviewsModal: React.FC<ReviewsModalProps> = ({ 
  visible, 
  onClose
}) => {
  const [userRating, setUserRating] = useState(0);
  const [comment, setComment] = useState('');

  // Datos de ejemplo
  const [allReviews, setAllReviews] = useState<Review[]>([
    {
      id: '1',
      user: 'Giuli uwu',
      rating: 4,
      comment: 'Malisimo servicio, una mierda la interfaz .',
      date: 'recien'
    },
  ]);

  // Calcular promedio y cantidad basado en las reseñas de ejemplo
  const averageRating = 4.3;
  const reviewCount = allReviews.length;

  const handleAddReview = () => {
    if (userRating === 0) {
      Alert.alert('Error', 'Por favor selecciona una calificación');
      return;
    }

    const newReview: Review = {
      id: Date.now().toString(),
      user: 'Tú',
      rating: userRating,
      comment: comment || 'Sin comentario',
      date: 'hace unos momentos'
    };

    setAllReviews([newReview, ...allReviews]);
    setUserRating(0);
    setComment('');
    Alert.alert('Éxito', 'Tu reseña ha sido publicada');
  };

  const renderStars = (rating: number, size: number = 16, interactive: boolean = false) => {
    return (
      <View className="flex-row">
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            disabled={!interactive}
            onPress={() => interactive && setUserRating(star)}
            className="mx-0.5"
          >
            <AntDesign
            name="star"
              size={size}
              fill={star <= rating ? '#FFD700' : 'transparent'}
              color={star <= rating ? '#FFD700' : '#D1D5DB'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        {/* Overlay semi-transparente */}
        <TouchableOpacity 
          className="absolute inset-0 bg-black/50"
          onPress={onClose}
          activeOpacity={1}
        />
        
        {/* Contenido del modal */}
        <View className="bg-white rounded-t-3xl h-4/5 mt-20">
          {/* Header fijo */}
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
            <Text className="text-xl font-bold text-gray-800">Reseñas</Text>
            <TouchableOpacity 
              onPress={onClose} 
              className="p-2 bg-gray-100 rounded-full"
            >
              <FontAwesome6 name="xmark-circle" size={20} color="#4B5563" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* Resumen de calificación */}
            <View className="p-4 border-b border-gray-100 bg-gray-50">
              <View className="items-center mb-4">
                <Text className="text-4xl font-bold text-gray-800">{averageRating.toFixed(1)}</Text>
                <Text className="text-gray-600 mb-2">de 5</Text>
                {renderStars(averageRating, 20)}
                <Text className="text-gray-500 mt-1">
                  {reviewCount} {reviewCount === 1 ? 'opinión' : 'opiniones'}
                </Text>
              </View>
            </View>

            {/* Sección para agregar reseña */}
            <View className="p-4 border-b border-gray-100">
              <Text className="text-lg font-semibold text-gray-800 mb-4">
                Agregar tu reseña
              </Text>
              
              {/* Calificación */}
              <View className="mb-4">
                <Text className="font-medium text-gray-700 mb-2">Calificación</Text>
                <View className="flex-row justify-center">
                  {renderStars(userRating, 28, true)}
                </View>
              </View>

              {/* Comentario */}
              <View className="mb-4">
                <Text className="font-medium text-gray-700 mb-2">Comentario</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-4 bg-white min-h-[120px] text-gray-800"
                  placeholder="Comparte tu experiencia con este estacionamiento..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  textAlignVertical="top"
                  value={comment}
                  onChangeText={setComment}
                  maxLength={500}
                />
                <Text className="text-right text-gray-500 text-sm mt-2">
                  {comment.length}/500
                </Text>
              </View>

              {/* Botón Publicar */}
              <TouchableOpacity
                className="bg-[#7BB5CB] rounded-lg py-4 px-6 active:bg-[#6aa4b9]"
                onPress={handleAddReview}
              >
                <Text className="text-white text-center font-semibold text-base">
                  Publicar reseña
                </Text>
              </TouchableOpacity>
            </View>

            {/* Lista de reseñas */}
            <View className="p-4">
              <Text className="text-lg font-semibold text-gray-800 mb-4">
                Todas las reseñas
              </Text>
              
              {allReviews.length === 0 ? (
                <Text className="text-gray-500 text-center py-4">
                  No hay reseñas aún. ¡Sé el primero en opinar!
                </Text>
              ) : (
                allReviews.map((review, index) => (
                  <View 
                    key={review.id} 
                    className={`pb-4 ${index !== allReviews.length - 1 ? 'border-b border-gray-100 mb-4' : 'mb-2'}`}
                  >
                    {/* Header de la reseña */}
                    <View className="flex-row justify-between items-start mb-2">
                      <Text className="font-semibold text-gray-800 text-base">
                        {review.user}
                      </Text>
                      <Text className="text-gray-500 text-sm">
                        {review.date}
                      </Text>
                    </View>
                    
                    {/* Estrellas */}
                    <View className="mb-2">
                      {renderStars(review.rating)}
                    </View>
                    
                    {/* Comentario */}
                    <Text className="text-gray-700 text-base leading-5">
                      {review.comment}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default ReviewsModal;