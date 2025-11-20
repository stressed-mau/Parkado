import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { getCalificacionesByParqueo, postCalificacion } from "@/api/CommentApi"; // AJUSTA LA RUTA CORRECTA
import StarRating from './StarRating';
import AsyncStorage from "@react-native-async-storage/async-storage";


interface Review {
  id: string;
  userId:number;
  user: string;
  rating: number;
  comment: string;
  date: string;
}

interface ReviewsModalProps {
  visible: boolean;
  onClose: () => void;
  parqueoId: number;
}

const ReviewsModal: React.FC<ReviewsModalProps> = ({ 
  visible, 
  onClose,
  parqueoId
}) => {
  const [userRating, setUserRating] = useState(0);
  const [comment, setComment] = useState('');
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const userReview = allReviews.find(r => r.userId === usuarioId);
  const userAlreadyReviewed = !!userReview;

useEffect(() => {
  const loadUser = async () => {
    const stored = await AsyncStorage.getItem("user");
    if (stored) {
      const user = JSON.parse(stored);
      setUsuarioId(user.id);
    }
  };
  loadUser();
}, []);


 useEffect(() => {
    if (visible && parqueoId) {
      loadReviews();
    }
  }, [visible, parqueoId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await getCalificacionesByParqueo(parqueoId);
      
      let reviewsArray: any[] = [];
      
      if (Array.isArray(data)) {
        reviewsArray = data;
      } else if (data && typeof data === 'object') {
        reviewsArray = [data];
      } else {
        reviewsArray = [];
      }
      const mappedReviews = reviewsArray.map((item) => ({
        id: item.id?.toString() || Math.random().toString(),
        userId: item.usuarioId, 
        user: `${item.usuario?.nombres || 'Usuario'} ${item.usuario?.apellidos || ''}`.trim(),
        rating: Number(item.puntuacion) || 0,
        comment: item.comentario || 'Sin comentario',
        date: item.fechaCreacion ? 
          new Date(item.fechaCreacion).toLocaleDateString() : 
          new Date().toLocaleDateString(),
      }));

      setAllReviews(mappedReviews);
    } catch (error) {
      console.error("Error cargando reseñas:", error);
      Alert.alert("Error", "No se pudieron cargar las reseñas");
    } finally {
      setLoading(false);
    }
  };

  const averageRating = allReviews.length > 0 
    ? allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length
    : 0;
  
  const reviewCount = allReviews.length;
  
  const handleSubmitReview = async () => {
  if (!userRating) {
    Alert.alert("Error", "Selecciona una calificación");
    return;
  }

  if (!comment.trim()) {
    Alert.alert("Error", "Escribe un comentario");
    return;
  }

  try {
    setSubmitting(true);

    const usuarioId = parqueoId;

    await postCalificacion({
      parqueoId,
      usuarioId,
      puntuacion: userRating,
      comentario: comment,
    });

    Alert.alert("Éxito", "Tu reseña fue publicada");

    await loadReviews();
    
    setUserRating(0);
    setComment("");

  } catch (error) {
    Alert.alert("Error", "No se pudo publicar la reseña");
  } finally {
    setSubmitting(false);
  }
};
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <TouchableOpacity 
          className="absolute inset-0 bg-black/50"
          onPress={onClose}
          activeOpacity={1}
        />
        
        <View className="bg-white rounded-t-3xl h-4/5 mt-20">
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
            {loading ? (
              <View className="flex-1 justify-center items-center py-8">
                <ActivityIndicator size="large" color="#7BB5CB" />
                <Text className="text-gray-600 mt-4">Cargando reseñas...</Text>
              </View>
            ) : (
              <>
            <View className="p-4 border-b border-gray-100">

              {userAlreadyReviewed ? (
                <>
                  <Text className="text-lg font-semibold text-gray-800 mb-4">
                    Tu opinión
                  </Text>

                  <View className="bg-gray-100 p-4 rounded-xl border border-gray-300">
                    <View className="flex-row justify-between mb-2">
                      <Text className="font-semibold text-gray-800">
                        {userReview?.user}
                      </Text>
                      <Text className="text-gray-500 text-sm">
                        {userReview?.date}
                      </Text>
                    </View>

                    <StarRating rating={userReview?.rating || 0} />

                    <Text className="text-gray-700 mt-2">
                      {userReview?.comment}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  {/* FORMULARIO NORMAL */}
                  <Text className="text-lg font-semibold text-gray-800 mb-4">
                    Agregar tu reseña
                  </Text>

                  <View className="mb-4">
                    <Text className="font-medium text-gray-700 mb-2">Calificación</Text>
                    <View className="flex-row justify-center">
                      <StarRating
                        rating={userRating}
                        size={28}
                        interactive
                        onRatingChange={setUserRating}
                      />
                    </View>
                  </View>

                  <View className="mb-4">
                    <Text className="font-medium text-gray-700 mb-2">Comentario</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg p-4 bg-white min-h-[100px] text-gray-800"
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

                  <TouchableOpacity
                    onPress={handleSubmitReview}
                    disabled={submitting}
                    className={`rounded-lg py-4 px-6 ${
                      submitting ? "bg-gray-400" : "bg-[#7BB5CB]"
                    }`}
                  >
                    {submitting ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white text-center font-semibold text-base">
                        Publicar reseña
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
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
                      <StarRating rating={review.rating} />
                    </View>
                    
                    {/* Comentario */}
                    <Text className="text-gray-700 text-base leading-5">
                      {review.comment}
                    </Text>
                  </View>
                ))
              )}
            </View>
            </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default ReviewsModal;