import React from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView } from 'react-native';

// Definición de la paleta de colores para referencia:
// F6EEE4 - Fondo (Piel claro)
// FD721D - Botón Primario (Naranja fuerte)
// F2BD2B - Botones Secundarios/Highlight (Amarillo)
// B2A83F - Etiquetas (Verde Oliva)
// 7BB3CD - Encabezado/Íconos (Azul claro)

const RegistroParqueo: React.FC = () => {
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.container}>
      <View style={styles.header}>
        {/* Usamos el azul claro para el título */}
        <Text style={styles.headerText}>REGISTRO DEL ESTACIONAMIENTO</Text>
      </View>

      <View style={styles.formSection}>
        {/* Campo: Nombre del estacionamiento */}
        <View style={styles.inputGroup}>
          {/* Usamos el verde oliva para las etiquetas */}
          <Text style={styles.label}>NOMBRE DEL ESTACIONAMIENTO*</Text>
          <TextInput style={styles.input} placeholder="NOMBRE DEL ESTACIONAMIENTO" />
        </View>

        {/* Campo: Dirección */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>DIRECCION*</Text>
          <View style={styles.locationInputContainer}>
            <TextInput style={styles.input} placeholder="DIRECCION" />
            <TouchableOpacity style={styles.locationIcon}>
              {/* Ícono de ubicación con color de destaque */}
              <Text style={{ fontSize: 24, color: '#7BB3CD' }}>📍</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Campo: Teléfono */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>TELEFONO*</Text>
          <TextInput style={styles.input} placeholder="TELEFONO" keyboardType="phone-pad" />
        </View>

        {/* Campo: Capacidad de autos */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>CAPACIDAD TOTAL DE AUTOS*</Text>
          <TextInput style={styles.input} placeholder="CAPACIDAD TOTAL DE AUTOS" keyboardType="numeric" />
        </View>

        {/* Campo: Capacidad de motos */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>CAPACIDAD TOTAL DE MOTOS*</Text>
          <TextInput style={styles.input} placeholder="CAPACIDAD TOTAL DE MOTOS" keyboardType="numeric" />
        </View>

        {/* Horario de apertura (ejemplo con Texto y un Ícono de Reloj en lugar de Switch) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>HORARIO DE APERTURA*</Text>
          <View style={styles.timeRow}>
            <Text style={styles.placeholderText}>SELECCIONAR HORA</Text>
            <Text style={{ fontSize: 20, color: '#7BB3CD' }}>🕒</Text>
          </View>
        </View>

        {/* Horario de cierre */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>HORARIO DE CIERRE*</Text>
          <View style={styles.timeRow}>
            <Text style={styles.placeholderText}>SELECCIONAR HORA</Text>
            <Text style={{ fontSize: 20, color: '#7BB3CD' }}>🕒</Text>
          </View>
        </View>

        {/* Campo: Tarifa de autos */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>TARIFA DE AUTOS*</Text>
          <TextInput style={styles.input} placeholder="TARIFA DE AUTOS" keyboardType="numeric" />
        </View>

        {/* Campo: Tarifa de motos */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>TARIFA DE MOTOS*</Text>
          <TextInput style={styles.input} placeholder="TARIFA DE MOTOS" keyboardType="numeric" />
        </View>

        {/* Campo: NIT */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>NIT*</Text>
          <TextInput style={styles.input} placeholder="NIT" />
        </View>

        {/* Botón para Licencia de funcionamiento */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>LICENCIA DE FUNCIONAMIENTO*</Text>
          <View style={styles.fileRow}>
            {/* Usamos el amarillo para el botón secundario de archivo */}
            <TouchableOpacity style={styles.fileButton}>
              <Text style={styles.fileButtonText}>SELECCIONAR ARCHIVO</Text>
            </TouchableOpacity>
            <TouchableOpacity>
               {/* Ícono de basurero para eliminar archivo */}
              <Text style={{ fontSize: 24, color: '#B2A83F' }}>🗑️</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.imagePlaceholder}>
             <Text style={{ fontSize: 40, color: '#7BB3CD' }}>🖼️</Text>
          </View>
        </View>

        {/* Botón para Foto de referencia */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>FOTO DE REFERENCIA</Text>
           <View style={styles.fileRow}>
             {/* Usamos el amarillo para el botón secundario de archivo */}
            <TouchableOpacity style={styles.fileButton}>
              <Text style={styles.fileButtonText}>SELECCIONAR ARCHIVO</Text>
            </TouchableOpacity>
            <TouchableOpacity>
               {/* Ícono de basurero para eliminar archivo */}
              <Text style={{ fontSize: 24, color: '#B2A83F' }}>🗑️</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.imagePlaceholder}>
             <Text style={{ fontSize: 40, color: '#7BB3CD' }}>🖼️</Text>
          </View>
        </View>
      </View>

      {/* Botón de REGISTRAR - Acción principal con color naranja vibrante */}
      <TouchableOpacity style={styles.registerButton}>
        <Text style={styles.registerButtonText}>REGISTRAR</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // F6EEE4: Fondo
  container: {
    flex: 1,
    backgroundColor: '#F6EEE4',
  },
  scrollContainer: {
    paddingBottom: 40, // Espacio al final de la scroll view
  },
  header: {
    padding: 20,
    alignItems: 'center',
    paddingTop: 50, // Ajuste para dar espacio bajo la barra de estado
    marginBottom: 10,
  },
  // 7BB3CD: Azul claro para el encabezado
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
  // B2A83F: Verde oliva para las etiquetas
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
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  locationIcon: {
    padding: 10,
  },
  // Fila para Horario/Tarifas con línea divisoria
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 10,
  },
  fileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#aaa',
    fontSize: 14,
  },
  // F2BD2B: Amarillo para el botón de archivo
  fileButton: {
    backgroundColor: '#F2BD2B',
    padding: 10,
    borderRadius: 5,
    width: '75%', // Ocupa la mayor parte del espacio en la fila
    alignItems: 'center',
  },
  fileButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  imagePlaceholder: {
    backgroundColor: '#fff',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  // FD721D: Naranja para el botón principal
  registerButton: {
    backgroundColor: '#FD721D',
    paddingVertical: 15,
    marginHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#FD721D', // Sombra para que destaque
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
});

export default RegistroParqueo;
