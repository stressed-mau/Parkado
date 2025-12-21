// components/Comment/Reviews.tsx
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
// Uso un import genérico para iconos y luego intento usar fuentes conocidas
import * as VectorIcons from '@expo/vector-icons';
import {
  getCalificacionesByParqueo,
  postCalificacion,
  deleteCalificacion,
} from "@/api/CommentApi";

import AsyncStorage from "@react-native-async-storage/async-storage";

// IMPORT GUARD: intenta importar StarRating pero si no es función usamos fallback
let StarRating: any;
try {
  // si tu StarRating exporta default, este require funciona; si exporta named, importa el .default o el named
  // ajusta la ruta si tu StarRating está en otra carpeta
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const sr = require('./StarRating');
  StarRating = sr && (typeof sr === 'function' ? sr : (sr.default ? sr.default : sr.StarRating));
} catch (e) {
  StarRating = null;
}

interface Review {
  id: string;
  userId: number;
  user: string;
  rating: number;
  comment: string;
  date: string;
}

interface ReviewsModalProps {
  visible: boolean;
  onClose: () => void;
  parqueoId: number;
  onReviewSubmitted?: () => void; // 👈 NUEVO
}


const SimpleStarFallback: React.FC<{ rating: number; size?: number }> = ({ rating }) => (
  <Text style={{ color: '#F2BD2B', fontSize: 18 }}>{'★'.repeat(Math.round(rating))}</Text>
);

const ReviewsModal: React.FC<ReviewsModalProps> = ({
  visible,
  onClose,
  parqueoId,
  onReviewSubmitted,
}) => {

  const [userRating, setUserRating] = useState(0);
  const [comment, setComment] = useState('');
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [usuarioId, setUsuarioId] = useState<number | null>(null);

  const userReview = allReviews.find(r => r.userId === usuarioId);
  const userAlreadyReviewed = !!userReview;

  // icon fallback: intenta usar FontAwesome5, si no está usa Texto
  const IconClose = (VectorIcons as any).FontAwesome5 ? (props: any) => <VectorIcons.FontAwesome5 {...props} /> : null;
  // si quieres otro icono, ajusta aquí

const handleDeleteReview = async (reviewId: string) => {
  if (!usuarioId) return;

  Alert.alert(
    "Eliminar reseña",
    "¿Estás seguro que deseas eliminar tu reseña?",
    [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteCalificacion(Number(reviewId), usuarioId);
            Alert.alert("Éxito", "Reseña eliminada");
            await loadReviews();
            onReviewSubmitted?.();
          } catch (error) {
            Alert.alert("Error", "No se pudo eliminar la reseña");
          }
        },
      },
    ]
  );
};


  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = await AsyncStorage.getItem("userData");
        if (stored) {
          const user = JSON.parse(stored);
          setUsuarioId(user.id);
        }
      } catch (err) {
        console.warn("No se pudo leer user desde AsyncStorage:", err);
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

    // obtenemos usuario si no lo tenemos
    let uid = usuarioId;
    if (!uid) {
      try {
        const stored = await AsyncStorage.getItem("userData");
        if (stored) {
          const user = JSON.parse(stored);
          uid = user.id;
        }
      } catch (e) {
        console.warn("No se pudo leer usuario para enviar reseña", e);
      }
    }

    if (!uid) {
      Alert.alert("Debe iniciar sesión", "Inicia sesión para poder publicar reseñas.");
      return;
    }

    try {
      setSubmitting(true);

      await postCalificacion({
        parqueoId,
        usuarioId: uid,
        puntuacion: userRating,
        comentario: comment,
      });

      Alert.alert("Éxito", "Tu reseña fue publicada");

      await loadReviews();

// 🔥 avisamos al padre que hubo nueva reseña
onReviewSubmitted?.();

setUserRating(0);
setComment("");


    } catch (error) {
      console.error("Error publicando reseña:", error);
      Alert.alert("Error", "No se pudo publicar la reseña");
    } finally {
      setSubmitting(false);
    }
  };

  // Si StarRating no es una función válida, usamos fallback
  const StarComponent = (StarRating && typeof StarRating === 'function') ? StarRating : SimpleStarFallback;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <TouchableOpacity
          style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={onClose}
          activeOpacity={1}
        />

        <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '80%', marginTop: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#eee' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#222' }}>Reseñas</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 8, backgroundColor: '#f3f3f3', borderRadius: 20 }}>
              {IconClose ? <IconClose name="times" size={20} color="#4B5563" /> : <Text style={{ fontSize: 18 }}>X</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>

            {loading ? (
              <View style={{ justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                <ActivityIndicator size="large" color="#7BB5CB" />
                <Text style={{ color: '#666', marginTop: 12 }}>Cargando reseñas...</Text>
              </View>
            ) : (
              <View>

                <View style={{ padding: 16, borderBottomWidth: 1, borderColor: '#f3f3f3' }}>
                  {userAlreadyReviewed ? (
                    <>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#222', marginBottom: 8 }}>Tu opinión</Text>
                      <View style={{ backgroundColor: '#f7f7f7', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#eee' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Text style={{ fontWeight: '700' }}>{userReview?.user}</Text>
                          <Text style={{ color: '#666' }}>{userReview?.date}</Text>
                        </View>
                        <View style={{ marginBottom: 8 }}>
                          <StarComponent rating={userReview?.rating || 0} />
                        </View>
                        <Text style={{ color: '#333' }}>{userReview?.comment}</Text>
                        <TouchableOpacity
  onPress={() => handleDeleteReview(userReview!.id)}
  style={{
    marginTop: 10,
    alignSelf: "flex-end",
    backgroundColor: "#EF4444",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  }}
>
  <Text style={{ color: "white", fontWeight: "700" }}>
    Eliminar
  </Text>
</TouchableOpacity>

                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#222', marginBottom: 8 }}>Agregar tu reseña</Text>

                      <View style={{ marginBottom: 12 }}>
                        <Text style={{ fontWeight: '600', color: '#333', marginBottom: 8 }}>Calificación</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                          <StarComponent rating={userRating} size={28} interactive onRatingChange={(v: number) => setUserRating(v)} />
                        </View>
                      </View>

                      <View style={{ marginBottom: 12 }}>
                        <Text style={{ fontWeight: '600', color: '#333', marginBottom: 8 }}>Comentario</Text>
                        <TextInput
                          style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, minHeight: 100, textAlignVertical: 'top' }}
                          placeholder="Comparte tu experiencia..."
                          placeholderTextColor="#9ca3af"
                          multiline
                          value={comment}
                          onChangeText={setComment}
                          maxLength={500}
                        />
                        <Text style={{ alignSelf: 'flex-end', color: '#6b7280', marginTop: 8 }}>{comment.length}/500</Text>
                      </View>

                      <TouchableOpacity
                        onPress={handleSubmitReview}
                        disabled={submitting}
                        style={{ backgroundColor: submitting ? '#9ca3af' : '#7BB5CB', paddingVertical: 14, borderRadius: 10, alignItems: 'center' }}
                      >
                        {submitting ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: '700' }}>Publicar reseña</Text>}
                      </TouchableOpacity>
                    </>
                  )}
                </View>

                <View style={{ padding: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#222', marginBottom: 12 }}>Todas las reseñas</Text>

                  {allReviews.length === 0 ? (
                    <Text style={{ color: '#6b7280', textAlign: 'center', paddingVertical: 16 }}>No hay reseñas aún. ¡Sé el primero en opinar!</Text>
                  ) : (
                    allReviews.map((review, index) => (
                      <View key={review.id} style={{ paddingBottom: 12, marginBottom: index !== allReviews.length - 1 ? 12 : 6, borderBottomWidth: index !== allReviews.length - 1 ? 1 : 0, borderColor: '#f3f3f3' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                          <Text style={{ fontWeight: '700' }}>{review.user}</Text>
                          <Text style={{ color: '#6b7280' }}>{review.date}</Text>
                        </View>

                        <View style={{ marginBottom: 8 }}>
                          <StarComponent rating={review.rating} />
                        </View>

                        <Text style={{ color: '#333', lineHeight: 20 }}>{review.comment}</Text>
                      </View>
                    ))
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default ReviewsModal;
