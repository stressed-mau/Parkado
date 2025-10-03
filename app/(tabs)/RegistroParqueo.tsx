import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { AntDesign, Feather } from '@expo/vector-icons';

// Interfaz para la imagen seleccionada
interface SelectedImage {
  uri: string | null;
}

const RegistroParqueo: React.FC = () => {
  // Estados para imágenes
  const [licenciaImage, setLicenciaImage] = useState<SelectedImage>({ uri: null });
  const [fotoReferencia, setFotoReferencia] = useState<SelectedImage>({ uri: null });

  // Estados para ubicación
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Obtener ubicación al montar
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permiso denegado para acceder a la ubicación.');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    })();
  }, []);

  // Función genérica para seleccionar imagen
  const pickImage = async (setImage: React.Dispatch<React.SetStateAction<SelectedImage>>) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso Requerido', 'Necesitamos acceso a la galería para seleccionar archivos.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage({ uri: result.assets[0].uri });
    }
  };

  // Función para abrir el selector de hora (simulado)
  const handleTimePicker = (field: string) => {
    Alert.alert('Selector de Hora', `Abriendo selector para ${field}.`);
  };

  // Render vista previa imagen o placeholder
  const renderImagePreview = (imageState: SelectedImage) => {
    if (imageState.uri) {
      return <Image source={{ uri: imageState.uri }} style={styles.imagePreview} />;
    }
    return (
      <View style={styles.imagePlaceholder}>
        <Feather name="image" size={40} color="#7BB3CD" />
      </View>
    );
  };

  // Botón de basurero
  const renderTrashButton = (setImage: React.Dispatch<React.SetStateAction<SelectedImage>>) => (
    <TouchableOpacity onPress={() => setImage({ uri: null })} style={styles.trashIcon}>
      <Feather name="trash" size={24} color="#B2A83F" />
    </TouchableOpacity>
  );

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>REGISTRO DEL ESTACIONAMIENTO</Text>
      </View>

      <View style={styles.formSection}>
        {/* Campo: Nombre */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>NOMBRE DEL ESTACIONAMIENTO*</Text>
          <TextInput style={styles.input} placeholder="NOMBRE DEL ESTACIONAMIENTO" />
        </View>

        {/* Campo: Dirección con Mapa */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>DIRECCIÓN*</Text>

          {location ? (
            <>
              <MapView
                style={styles.map}
                region={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={location}
                  draggable
                  onDragEnd={(e) => {
                    setLocation({
                      latitude: e.nativeEvent.coordinate.latitude,
                      longitude: e.nativeEvent.coordinate.longitude,
                    });
                  }}
                  title="Mi ubicación"
                />
              </MapView>
              <Text style={styles.coordsText}>
                Lat: {location.latitude.toFixed(6)} | Lng: {location.longitude.toFixed(6)}
              </Text>
            </>
          ) : (
            <Text>{errorMsg ? errorMsg : 'Obteniendo ubicación...'}</Text>
          )}
        </View>

        {/* Teléfono */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>TELEFONO*</Text>
          <TextInput style={styles.input} placeholder="TELEFONO" keyboardType="phone-pad" />
        </View>

        {/* Capacidad */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>CAPACIDAD TOTAL DE AUTOS*</Text>
          <TextInput style={styles.input} placeholder="CAPACIDAD TOTAL DE AUTOS" keyboardType="numeric" />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>CAPACIDAD TOTAL DE MOTOS*</Text>
          <TextInput style={styles.input} placeholder="CAPACIDAD TOTAL DE MOTOS" keyboardType="numeric" />
        </View>

        {/* Horarios */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>HORARIO DE APERTURA*</Text>
          <TouchableOpacity onPress={() => handleTimePicker('apertura')} style={styles.timeRow}>
            <Text style={styles.placeholderText}>SELECCIONAR HORA</Text>
            <AntDesign name="clockcircleo" size={20} color="#7BB3CD" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>HORARIO DE CIERRE*</Text>
          <TouchableOpacity onPress={() => handleTimePicker('cierre')} style={styles.timeRow}>
            <Text style={styles.placeholderText}>SELECCIONAR HORA</Text>
            <AntDesign name="clockcircleo" size={20} color="#7BB3CD" />
          </TouchableOpacity>
        </View>

        {/* Tarifas */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>TARIFA DE AUTOS*</Text>
          <TextInput style={styles.input} placeholder="TARIFA DE AUTOS" keyboardType="numeric" />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>TARIFA DE MOTOS*</Text>
          <TextInput style={styles.input} placeholder="TARIFA DE MOTOS" keyboardType="numeric" />
        </View>

        {/* NIT */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>NIT*</Text>
          <TextInput style={styles.input} placeholder="NIT" />
        </View>

        {/* Licencia */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>LICENCIA DE FUNCIONAMIENTO*</Text>
          <View style={styles.fileRow}>
            <TouchableOpacity onPress={() => pickImage(setLicenciaImage)} style={styles.fileButton}>
              <Text style={styles.fileButtonText}>SELECCIONAR ARCHIVO</Text>
            </TouchableOpacity>
            {renderTrashButton(setLicenciaImage)}
          </View>
          {renderImagePreview(licenciaImage)}
        </View>

        {/* Foto de referencia */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>FOTO DE REFERENCIA</Text>
          <View style={styles.fileRow}>
            <TouchableOpacity onPress={() => pickImage(setFotoReferencia)} style={styles.fileButton}>
              <Text style={styles.fileButtonText}>SELECCIONAR ARCHIVO</Text>
            </TouchableOpacity>
            {renderTrashButton(setFotoReferencia)}
          </View>
          {renderImagePreview(fotoReferencia)}
        </View>
      </View>

      {/* Botón Registrar */}
      <TouchableOpacity style={styles.registerButton}>
        <Text style={styles.registerButtonText}>REGISTRAR</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6EEE4',
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    paddingTop: 50,
    marginBottom: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7BB3CD',
  },
  formSection: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 12,
    color: '#B2A83F',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 5,
    fontSize: 14,
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 10,
    paddingRight: 10,
  },
  placeholderText: {
    color: '#aaa',
    fontSize: 14,
  },
  fileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  fileButton: {
    backgroundColor: '#F2BD2B',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
  },
  fileButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  trashIcon: {
    padding: 10,
  },
  imagePlaceholder: {
    backgroundColor: '#fff',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  registerButton: {
    backgroundColor: '#FD721D',
    paddingVertical: 15,
    marginHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#FD721D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Estilos del mapa y coordenadas
  map: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 10,
  },
  coordsText: {
    marginTop: 8,
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default RegistroParqueo;
