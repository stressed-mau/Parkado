import React, { useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
 

// --- TIPOS ---
type Horario = {
  id: number;
  diaSemana: string;
  horaAbrir: string | null;
  horaCerrar: string | null;
  esCerrado: boolean | null;
  parqueoId: number;
};

type Capacidad = {
  id: number;
  cantidad: number;
  parqueoId: number;
  tipoVehiculoId: number;
  tipoVehiculo: {
    id: number;
    nombre: string;
    descripcion: string;
  };
};

type Tarifa = {
  id: number;
  descripcion: string;
  precioHora: string;
  precioDia: string | null;
  estado: string | null;
  parqueoId: number;
  tipoVehiculoId: number;
};

type Foto = {
  id: number;
  url: string;
  parqueoId: number;
};

type Calificacion = {
  id: number;
  puntuacion: string;
  comentario: string;
  usuarioId: number;
  parqueoId: number;
};

type Servicio = {
  id: number;
  estado: boolean;
  parqueoId: number;
  servicioId: number;
  servicio: {
    id: number;
    nombre: string;
    descripcion: string;
  };
};

type Plaza = {
  id: number;
  nroPlaza: string;
  ubicacionPiso: string | null;
  estado: string | null;
  parqueoId: number;
  tipoVehiculoId: number;
};

type Parqueo = {
  id: number;
  nombre: string;
  direccion: string;
  tipoLugar: string;
  propietarioId: number;
  horarios: Horario[];
  calificaciones: Calificacion[];
  capacidades: Capacidad[];
  servicios: Servicio[];
  plazas: Plaza[];
  tarifas: Tarifa[];
  fotos: Foto[];
  latitud: number;
  longitud: number;
  serviciosAsociados?: number[];
};

interface ParkeoPopupProps {
  details: Parqueo;
  onClose: () => void;
  onShowDirections?: (coords: {
    latitude: number;
    longitude: number;
    name: string;
  }) => void;
  showingDirections?: boolean;
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 100,
    zIndex: 40,
  },
  card: {
    padding: 20,
    marginHorizontal: 20,
    backgroundColor: '#F6EEE4',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 50,
    width: '90%',
    maxWidth: 400,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 6,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 20,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    width: 20,
    height: 20,
    textAlign: 'center',
    lineHeight: 18,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 16,
  },
  imageContainer: {
    width: 100,
    height: 80,
    backgroundColor: 'white',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    flex: 1,
    paddingRight: 8,
  },
  nameText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 6,
    lineHeight: 22,
  },
  addressText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    lineHeight: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ratingValueText: {
    fontSize: 13,
    color: '#000',
    marginLeft: 6,
    fontWeight: '600',
  },
  detailsText: {
    fontSize: 12,
    color: '#000',
    marginBottom: 6,
    lineHeight: 16,
  },
  disponibilidadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  disponibilidadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(123, 181, 203, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  disponibilidadText: {
    fontSize: 11,
    fontWeight: '600',
  },
  disponibilidadAuto: {
    color: '#7BB5CB',
  },
  disponibilidadMoto: {
    color: '#FD721D',
  },
  disponibilidadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  disponibilidadDotAuto: {
    backgroundColor: '#7BB5CB',
  },
  disponibilidadDotMoto: {
    backgroundColor: '#FD721D',
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  availabilityDotAvailable: {
    backgroundColor: '#10B981',
  },
  availabilityDotFull: {
    backgroundColor: '#EF4444',
  },
  availabilityText: {
    fontSize: 13,
    fontWeight: '600',
  },
  availabilityTextAvailable: {
    color: '#10B981',
  },
  availabilityTextFull: {
    color: '#EF4444',
  },
  buttonsContainer: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
    justifyContent: 'space-between',
  },
  buttonBase: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonPrimary: {
    backgroundColor: '#000',
  },
  buttonSecondary: {
    backgroundColor: '#7BB5CB',
  },
  buttonText: {
    color: '#F6EEE4',
    fontWeight: '600',
    fontSize: 14,
  },
});

// --- COMPONENTE ---
const ParkeoPopup: React.FC<ParkeoPopupProps> = ({
  details,
  onClose,
  onShowDirections,
  showingDirections = false,
}) => {

  


  const router = useRouter();

  const RatingStars = useCallback(({ count }: { count: number }) => {
    const fullStars = Math.floor(count);
    const emptyStars = 5 - Math.max(0, Math.min(5, fullStars));
    return (
      <Text style={{ color: '#F2BD2B', fontSize: 14 }}>
        {'★'.repeat(fullStars)}
        {'☆'.repeat(emptyStars)}
      </Text>
    );
  }, []);

  const getHorarioFormateado = (horarios: Horario[]) => {
    if (!horarios || horarios.length === 0) {
      return 'Horario no disponible';
    }

    const hoy = new Date().getDay();
    const diasSemana = [
      'Domingo',
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
    ];
    const diaActual = diasSemana[hoy];

    const horarioHoy = horarios.find(
      (h) => h.diaSemana.toLowerCase() === diaActual.toLowerCase()
    );

    if (!horarioHoy) return 'Cerrado hoy';
    if (horarioHoy.esCerrado) return 'Cerrado hoy';
    if (!horarioHoy.horaAbrir || !horarioHoy.horaCerrar)
      return 'Horario no definido';

    const formatHora = (hora: string) => {
      try {
        const [hours, minutes] = hora.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        return date.toLocaleTimeString('es-BO', {
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch {
        return '--:--';
      }
    };

    return `${formatHora(horarioHoy.horaAbrir)} - ${formatHora(
      horarioHoy.horaCerrar
    )}`;
  };

  const getTarifas = (tarifas: Tarifa[]) => {
    if (!tarifas || tarifas.length === 0) {
      return { auto: 'N/A', moto: 'N/A', tieneDatos: false };
    }

    const tarifaAuto = tarifas.find((t) => t.tipoVehiculoId === 1);
    const tarifaMoto = tarifas.find((t) => t.tipoVehiculoId === 2);

    return {
      auto: tarifaAuto ? `${parseFloat(tarifaAuto.precioHora).toFixed(1)} Bs/h` : 'N/A',
      moto: tarifaMoto ? `${parseFloat(tarifaMoto.precioHora).toFixed(1)} Bs/h` : 'N/A',
      tieneDatos: !!(tarifaAuto || tarifaMoto),
    };
  };

  const getDisponibilidadReal = (capacidades: Capacidad[], plazas: Plaza[]) => {
    const capacidadAutoObj = capacidades?.find((c) => c.tipoVehiculoId === 1);
    const capacidadMotoObj = capacidades?.find((c) => c.tipoVehiculoId === 2);

    const capacidadAutos = capacidadAutoObj ? capacidadAutoObj.cantidad : 0;
    const capacidadMotos = capacidadMotoObj ? capacidadMotoObj.cantidad : 0;

    let disponibilidadAutos = 0;
    let disponibilidadMotos = 0;

    if (plazas && plazas.length > 0) {
      const plazasAutoDisponibles = plazas.filter(
        (plaza) =>
          plaza.tipoVehiculoId === 1 &&
          (plaza.estado === 'DISPONIBLE' ||
            plaza.estado === 'libre' ||
            plaza.estado === null)
      );

      const plazasMotoDisponibles = plazas.filter(
        (plaza) =>
          plaza.tipoVehiculoId === 2 &&
          (plaza.estado === 'DISPONIBLE' ||
            plaza.estado === 'libre' ||
            plaza.estado === null)
      );

      disponibilidadAutos = plazasAutoDisponibles.length;
      disponibilidadMotos = plazasMotoDisponibles.length;
    } else {
      disponibilidadAutos = capacidadAutos;
      disponibilidadMotos = capacidadMotos;
    }

    return {
      capacidadAutos,
      capacidadMotos,
      disponibilidadAutos,
      disponibilidadMotos,
      formatoAuto: `${disponibilidadAutos} / ${capacidadAutos}`,
      formatoMoto: `${disponibilidadMotos} / ${capacidadMotos}`,
      tieneDisponibilidad:
        disponibilidadAutos > 0 || disponibilidadMotos > 0,
    };
  };

  const getRatingPromedio = (calificaciones: Calificacion[]) => {
    if (!calificaciones || calificaciones.length === 0) {
      return 0;
    }

    const suma = calificaciones.reduce((acc, cal) => {
      const puntuacion = parseFloat(cal.puntuacion) || 0;
      return acc + puntuacion;
    }, 0);

    return suma / calificaciones.length;
  };

  const getImagenPrincipal = (fotos: Foto[]) => {
    if (!fotos || fotos.length === 0) {
      return 'https://via.placeholder.com/200x160?text=Sin+Imagen';
    }
    return fotos[0].url;
  };

  const handleNavigateToDetails = () => {
    if (typeof details.latitud !== 'number' || typeof details.longitud !== 'number') {
      Alert.alert('Error', 'Datos de ubicación incompletos para este parqueo.');
      return;
    }

    const tarifasInfo = getTarifas(details.tarifas);
    const disponibilidadInfo = getDisponibilidadReal(
      details.capacidades,
      details.plazas
    );
    const ratingPromedio = getRatingPromedio(details.calificaciones);

    const params = {
      id: details.id.toString(),
      parqueoNombre: details.nombre,
      direccion: details.direccion,
      tarifaAuto: tarifasInfo.auto
        .replace(' Bs/h', '')
        .replace('N/A', '0'),
      tarifaMoto: tarifasInfo.moto
        .replace(' Bs/h', '')
        .replace('N/A', '0'),
      capacidadAutos: disponibilidadInfo.capacidadAutos.toString(),
      capacidadMotos: disponibilidadInfo.capacidadMotos.toString(),
      disponibilidadAutos:
        disponibilidadInfo.disponibilidadAutos.toString(),
      disponibilidadMotos:
        disponibilidadInfo.disponibilidadMotos.toString(),
      parqueoLat: details.latitud.toString(),
      parqueoLng: details.longitud.toString(),
      rating: ratingPromedio.toFixed(1),
      tipoLugar: details.tipoLugar,
      horarios: JSON.stringify(details.horarios || []),
      servicios: JSON.stringify(details.servicios || []),
      fotos: JSON.stringify(details.fotos || []),
    };

    router.push({
      pathname: `/parqueo-detalle/${details.id}` as any,
      params,
    });
    onClose();
  };

  const handleDirectionsPress = () => {
    if (!onShowDirections) {
      return;
    }

    if (typeof details.latitud !== 'number' || typeof details.longitud !== 'number') {
      Alert.alert(
        'Error',
        'No se pueden obtener las coordenadas de este parqueo.'
      );
      return;
    }

    onShowDirections({
      latitude: details.latitud,
      longitude: details.longitud,
      name: details.nombre,
    });
    onClose();
  };

  if (!details || !details.nombre) {
    return (
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            { alignItems: 'center', justifyContent: 'center', minHeight: 150 },
          ]}
        >
          <ActivityIndicator size="small" color="#7BB5CB" />
          <Text style={{ marginTop: 10, color: '#666' }}>
            Cargando información...
          </Text>
        </View>
      </View>
    );
  }

  const {
    nombre,
    direccion,
    horarios = [],
    tarifas = [],
    capacidades = [],
    plazas = [],
    calificaciones = [],
    fotos = [],
  } = details;

  const ratingPromedio = getRatingPromedio(calificaciones);
  const horarioFormateado = getHorarioFormateado(horarios);
  const tarifasInfo = getTarifas(tarifas);
  const disponibilidadInfo = getDisponibilidadReal(capacidades, plazas);
  const imageUri = getImagenPrincipal(fotos);

  const detailsText = `Horario: ${horarioFormateado}`;
  const tarifasText = `Tarifas: Auto ${tarifasInfo.auto}, Moto ${tarifasInfo.moto}`;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeButton}
          activeOpacity={0.7}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.contentRow}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              resizeMode="cover"
            />
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.nameText} numberOfLines={2}>
              {nombre}
            </Text>
            <Text style={styles.addressText} numberOfLines={2}>
              {direccion}
            </Text>

            <View style={styles.ratingRow}>
              <RatingStars count={ratingPromedio} />
              <Text style={styles.ratingValueText}>
                {ratingPromedio > 0
                  ? ratingPromedio.toFixed(1)
                  : 'Sin calificaciones'}
              </Text>
            </View>

            <Text style={styles.detailsText} numberOfLines={2}>
              {detailsText}
            </Text>
            <Text style={styles.detailsText} numberOfLines={1}>
              {tarifasText}
            </Text>

            <View style={styles.disponibilidadContainer}>
              <View style={styles.disponibilidadItem}>
                <View
                  style={[
                    styles.disponibilidadDot,
                    styles.disponibilidadDotAuto,
                  ]}
                />
                <Text
                  style={[
                    styles.disponibilidadText,
                    styles.disponibilidadAuto,
                  ]}
                >
                  Auto: {disponibilidadInfo.formatoAuto}
                </Text>
              </View>

              <View style={styles.disponibilidadItem}>
                <View
                  style={[
                    styles.disponibilidadDot,
                    styles.disponibilidadDotMoto,
                  ]}
                />
                <Text
                  style={[
                    styles.disponibilidadText,
                    styles.disponibilidadMoto,
                  ]}
                >
                  Moto: {disponibilidadInfo.formatoMoto}
                </Text>
              </View>
            </View>

            <View style={styles.availabilityContainer}>
              <View
                style={[
                  styles.availabilityDot,
                  disponibilidadInfo.tieneDisponibilidad
                    ? styles.availabilityDotAvailable
                    : styles.availabilityDotFull,
                ]}
              />
              <Text
                style={[
                  styles.availabilityText,
                  disponibilidadInfo.tieneDisponibilidad
                    ? styles.availabilityTextAvailable
                    : styles.availabilityTextFull,
                ]}
              >
                {disponibilidadInfo.tieneDisponibilidad
                  ? 'Disponible'
                  : 'Completo'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            onPress={handleNavigateToDetails}
            style={[styles.buttonBase, styles.buttonPrimary]}
            activeOpacity={0.8}
            disabled={!disponibilidadInfo.tieneDisponibilidad}
          >
            <Feather name="calendar" size={16} color="#F6EEE4" />
            <Text style={styles.buttonText}>
              {disponibilidadInfo.tieneDisponibilidad ? 'Reservar' : 'Completo'}
            </Text>
          </TouchableOpacity>

          {onShowDirections && (
            <TouchableOpacity
              onPress={handleDirectionsPress}
              style={[styles.buttonBase, styles.buttonSecondary]}
              activeOpacity={0.8}
            >
              <Feather name="navigation" size={16} color="#F6EEE4" />
              <Text style={styles.buttonText}>Cómo Llegar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export default ParkeoPopup;
