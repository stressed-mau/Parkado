import React, { useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// --- TIPOS CORREGIDOS para coincidir con la API REAL ---
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
    puntuacion: string;  // ❗️La API devuelve string, no number
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

// ✅ TIPO CORREGIDO para coincidir con la API REAL
type Parqueo = {
    id: number;  // ✅ CAMBIADO a number
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
    descripcion?: string;
};

interface ParkeoPopupProps {
    details: Parqueo;
    onClose: () => void;
    onShowDirections?: (coords: { latitude: number; longitude: number; name: string }) => void;
    showingDirections?: boolean;
}

// --- ESTILOS ACTUALIZADOS ---
const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 80,
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
    capacityText: { 
        fontSize: 12, 
        color: '#000', 
        marginBottom: 8,
        fontWeight: '500',
    },
    // NUEVOS ESTILOS PARA OPCIÓN C
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

// --- COMPONENTE PRINCIPAL ACTUALIZADO (OPCIÓN C) ---
const ParkeoPopup: React.FC<ParkeoPopupProps> = ({
    details,
    onClose,
    onShowDirections,
    showingDirections = false
}) => {
    const router = useRouter();

    // --- FUNCIONES AUXILIARES MEJORADAS con OPCIÓN C ---

    const RatingStars = useCallback(({ count }: { count: number }) => {
        const fullStars = Math.floor(count);
        const emptyStars = 5 - Math.max(0, Math.min(5, fullStars));
        return (
            <Text style={{ color: '#F2BD2B', fontSize: 14 }}>
                {'★'.repeat(fullStars)}{'☆'.repeat(emptyStars)}
            </Text>
        );
    }, []);

    // ✅ Función MEJORADA para formatear horarios
    const getHorarioFormateado = (horarios: Horario[]) => {
        console.log('🕐 Horarios recibidos en Popup:', horarios);
        
        if (!horarios || horarios.length === 0) {
            console.log('❌ No hay horarios disponibles');
            return 'Horario no disponible';
        }
        
        const hoy = new Date().getDay();
        const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const diaActual = diasSemana[hoy];
        
        console.log(`📅 Buscando horario para: ${diaActual} (día ${hoy})`);
        
        const horarioHoy = horarios.find(h => 
            h.diaSemana.toLowerCase() === diaActual.toLowerCase()
        );
        
        console.log('🔍 Horario encontrado para hoy:', horarioHoy);
        
        if (!horarioHoy) return 'Cerrado hoy';
        if (horarioHoy.esCerrado) return 'Cerrado hoy';
        if (!horarioHoy.horaAbrir || !horarioHoy.horaCerrar) return 'Horario no definido';
        
        const formatHora = (hora: string) => {
            try {
                const date = new Date(hora);
                return date.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
            } catch (error) {
                console.error('❌ Error formateando hora:', hora, error);
                return '--:--';
            }
        };
        
        const horario = `${formatHora(horarioHoy.horaAbrir)} - ${formatHora(horarioHoy.horaCerrar)}`;
        console.log('✅ Horario formateado:', horario);
        return horario;
    };

    // ✅ Función MEJORADA para obtener tarifas con DEBUG
    const getTarifas = (tarifas: Tarifa[]) => {
        console.log('💰 Tarifas recibidas en Popup:', tarifas);
        
        if (!tarifas || tarifas.length === 0) {
            console.log('❌ No hay tarifas disponibles');
            return { auto: 'N/A', moto: 'N/A', tieneDatos: false };
        }
        
        const tarifaAuto = tarifas.find(t => t.tipoVehiculoId === 1);
        const tarifaMoto = tarifas.find(t => t.tipoVehiculoId === 2);
        
        console.log('🔍 Tarifas encontradas:', { tarifaAuto, tarifaMoto });
        
        const resultado = {
            auto: tarifaAuto ? `${parseFloat(tarifaAuto.precioHora).toFixed(1)} Bs/h` : 'N/A',
            moto: tarifaMoto ? `${parseFloat(tarifaMoto.precioHora).toFixed(1)} Bs/h` : 'N/A',
            tieneDatos: !!(tarifaAuto || tarifaMoto)
        };
        
        console.log('✅ Tarifas procesadas:', resultado);
        return resultado;
    };

    // ✅ Función NUEVA para OPCIÓN C: Calcular disponibilidad real
    const getDisponibilidadReal = (capacidades: Capacidad[], plazas: Plaza[]) => {
        console.log('🅿️ Calculando disponibilidad real:', {
            capacidades,
            totalPlazas: plazas?.length
        });

        // Obtener capacidades teóricas
        const capacidadAutoObj = capacidades?.find(c => c.tipoVehiculoId === 1);
        const capacidadMotoObj = capacidades?.find(c => c.tipoVehiculoId === 2);
        
        const capacidadAutos = capacidadAutoObj ? capacidadAutoObj.cantidad : 0;
        const capacidadMotos = capacidadMotoObj ? capacidadMotoObj.cantidad : 0;

        // Calcular disponibilidad real contando plazas disponibles
        let disponibilidadAutos = 0;
        let disponibilidadMotos = 0;

        if (plazas && plazas.length > 0) {
            const plazasAutoDisponibles = plazas.filter(plaza => 
                plaza.tipoVehiculoId === 1 && 
                (plaza.estado === 'DISPONIBLE' || plaza.estado === 'libre' || plaza.estado === null)
            );
            
            const plazasMotoDisponibles = plazas.filter(plaza => 
                plaza.tipoVehiculoId === 2 && 
                (plaza.estado === 'DISPONIBLE' || plaza.estado === 'libre' || plaza.estado === null)
            );

            disponibilidadAutos = plazasAutoDisponibles.length;
            disponibilidadMotos = plazasMotoDisponibles.length;
        } else {
            // Si no hay plazas definidas, usar capacidades como disponibilidad
            disponibilidadAutos = capacidadAutos;
            disponibilidadMotos = capacidadMotos;
        }

        const resultado = {
            capacidadAutos,
            capacidadMotos,
            disponibilidadAutos,
            disponibilidadMotos,
            formatoAuto: `${disponibilidadAutos} / ${capacidadAutos}`,
            formatoMoto: `${disponibilidadMotos} / ${capacidadMotos}`,
            tieneDisponibilidad: (disponibilidadAutos > 0 || disponibilidadMotos > 0)
        };

        console.log('✅ Disponibilidad real calculada:', resultado);
        return resultado;
    };

    // ✅ Función MEJORADA para calcular rating
    const getRatingPromedio = (calificaciones: Calificacion[]) => {
        console.log('⭐ Calificaciones recibidas:', calificaciones);
        
        if (!calificaciones || calificaciones.length === 0) {
            console.log('❌ No hay calificaciones');
            return 0;
        }
        
        const suma = calificaciones.reduce((acc, cal) => {
            const puntuacion = parseFloat(cal.puntuacion) || 0;
            return acc + puntuacion;
        }, 0);
        
        const promedio = suma / calificaciones.length;
        console.log('✅ Rating promedio calculado:', promedio);
        return promedio;
    };

    // ✅ Función MEJORADA para obtener imagen principal
    const getImagenPrincipal = (fotos: Foto[]) => {
        console.log('🖼 Fotos recibidas:', fotos);
        
        if (!fotos || fotos.length === 0) {
            console.log('❌ No hay fotos disponibles');
            return 'https://via.placeholder.com/200x160?text=Sin+Imagen';
        }
        
        console.log('✅ Usando primera foto:', fotos[0].url);
        return fotos[0].url;
    };

    // --- MANEJADORES DE EVENTOS ---

    const handleNavigateToDetails = () => {
        console.log('📍 Iniciando navegación a detalles...');
        console.log('📋 Datos completos recibidos en Popup:', details);

        // Validar datos esenciales
        if (typeof details.latitud !== 'number' || typeof details.longitud !== 'number') {
            console.error("❌ Coordenadas inválidas:", details);
            Alert.alert("Error", "Datos de ubicación incompletos para este parqueo.");
            return;
        }

        // Obtener datos REALES de la API
        const tarifasInfo = getTarifas(details.tarifas);
        const disponibilidadInfo = getDisponibilidadReal(details.capacidades, details.plazas);
        const ratingPromedio = getRatingPromedio(details.calificaciones);

        // Preparar parámetros para navegación
        const params = {
            id: details.id.toString(),
            parqueoNombre: details.nombre,
            direccion: details.direccion,
            tarifaAuto: tarifasInfo.auto.replace(' Bs/h', '').replace('N/A', '0'),
            tarifaMoto: tarifasInfo.moto.replace(' Bs/h', '').replace('N/A', '0'),
            capacidadAutos: disponibilidadInfo.capacidadAutos.toString(),
            capacidadMotos: disponibilidadInfo.capacidadMotos.toString(),
            disponibilidadAutos: disponibilidadInfo.disponibilidadAutos.toString(),
            disponibilidadMotos: disponibilidadInfo.disponibilidadMotos.toString(),
            parqueoLat: details.latitud.toString(),
            parqueoLng: details.longitud.toString(),
            rating: ratingPromedio.toFixed(1),
            tipoLugar: details.tipoLugar,
            horarios: JSON.stringify(details.horarios || []),
            servicios: JSON.stringify(details.servicios || []),
            fotos: JSON.stringify(details.fotos || [])
        };

        console.log('🚀 Navegando a detalles con params OPCIÓN C:', params);
        
        router.push({
            pathname: '/parqueo-detalle/[id]' as any,
            params: params
        });
        onClose();
    };

    const handleDirectionsPress = () => {
        if (!onShowDirections) {
            console.warn("❌ onShowDirections no proporcionado");
            return;
        }

        if (typeof details.latitud !== 'number' || typeof details.longitud !== 'number') {
            console.error("❌ Coordenadas inválidas para direcciones:", details);
            Alert.alert("Error", "No se pueden obtener las coordenadas de este parqueo.");
            return;
        }

        console.log('🧭 Solicitando direcciones para:', details.nombre);
        
        onShowDirections({
            latitude: details.latitud,
            longitude: details.longitud,
            name: details.nombre
        });
        onClose();
    };

    // --- VALIDACIÓN Y EXTRACCIÓN DE DATOS ---

    // ✅ DEBUG: Verificar qué datos llegan al Popup
    console.log('🎯 POPUP - Datos recibidos:', {
        tieneHorarios: !!details?.horarios?.length,
        horariosCount: details?.horarios?.length,
        tieneTarifas: !!details?.tarifas?.length, 
        tarifasCount: details?.tarifas?.length,
        tieneCapacidades: !!details?.capacidades?.length,
        tienePlazas: !!details?.plazas?.length,
        plazasCount: details?.plazas?.length,
        datosCompletos: details
    });

    if (!details || !details.nombre) {
        console.warn("❌ ParkeoPopup: 'details' es inválido:", details);
        return (
            <View style={styles.overlay}>
                <View style={[styles.card, { alignItems: 'center', justifyContent: 'center', minHeight: 150 }]}>
                    <ActivityIndicator size="small" color="#7BB5CB" />
                    <Text style={{ marginTop: 10, color: '#666' }}>Cargando información...</Text>
                </View>
            </View>
        );
    }

    // Extraer y procesar datos REALES de la API
    const { 
        nombre, 
        direccion, 
        horarios = [], 
        tarifas = [], 
        capacidades = [],
        plazas = [],
        calificaciones = [],
        fotos = []
    } = details;

    const ratingPromedio = getRatingPromedio(calificaciones);
    const horarioFormateado = getHorarioFormateado(horarios);
    const tarifasInfo = getTarifas(tarifas);
    const disponibilidadInfo = getDisponibilidadReal(capacidades, plazas);
    const imageUri = getImagenPrincipal(fotos);

    // Textos informativos para OPCIÓN C
    const detailsText = `Horario: ${horarioFormateado}`;
    const tarifasText = `Tarifas: Auto ${tarifasInfo.auto}, Moto ${tarifasInfo.moto}`;

    // --- RENDER PRINCIPAL ACTUALIZADO (OPCIÓN C) ---
    return (
        <View style={styles.overlay}>
            <View style={styles.card}>
                
                {/* BOTÓN CERRAR */}
                <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
                    <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>

                {/* CONTENIDO PRINCIPAL */}
                <View style={styles.contentRow}>
                    
                    {/* IMAGEN */}
                    <View style={styles.imageContainer}>
                        <Image 
                            source={{ uri: imageUri }} 
                            style={styles.image} 
                            resizeMode="cover" 
                            onError={() => console.log("❌ Error cargando imagen del parqueo")}
                        />
                    </View>

                    {/* INFORMACIÓN */}
                    <View style={styles.infoContainer}>
                        
                        {/* NOMBRE Y DIRECCIÓN */}
                        <Text style={styles.nameText} numberOfLines={2}>{nombre}</Text>
                        <Text style={styles.addressText} numberOfLines={2}>{direccion}</Text>

                        {/* RATING */}
                        <View style={styles.ratingRow}>
                            <RatingStars count={ratingPromedio} />
                            <Text style={styles.ratingValueText}>
                                {ratingPromedio > 0 ? ratingPromedio.toFixed(1) : 'Sin calificaciones'}
                            </Text>
                        </View>

                        {/* DETALLES */}
                        <Text style={styles.detailsText} numberOfLines={2}>{detailsText}</Text>
                        <Text style={styles.detailsText} numberOfLines={1}>{tarifasText}</Text>

                        {/* DISPONIBILIDAD - OPCIÓN C: "disponibles/totales" */}
                        <View style={styles.disponibilidadContainer}>
                            {/* Auto */}
                            <View style={styles.disponibilidadItem}>
                                <View style={[styles.disponibilidadDot, styles.disponibilidadDotAuto]} />
                                <Text style={[styles.disponibilidadText, styles.disponibilidadAuto]}>
                                    Auto: {disponibilidadInfo.formatoAuto}
                                </Text>
                            </View>
                            
                            {/* Moto */}
                            <View style={styles.disponibilidadItem}>
                                <View style={[styles.disponibilidadDot, styles.disponibilidadDotMoto]} />
                                <Text style={[styles.disponibilidadText, styles.disponibilidadMoto]}>
                                    Moto: {disponibilidadInfo.formatoMoto}
                                </Text>
                            </View>
                        </View>

                        {/* INDICADOR GENERAL DE DISPONIBILIDAD */}
                        <View style={styles.availabilityContainer}>
                            <View style={[
                                styles.availabilityDot, 
                                disponibilidadInfo.tieneDisponibilidad 
                                    ? styles.availabilityDotAvailable 
                                    : styles.availabilityDotFull
                            ]} />
                            <Text style={[
                                styles.availabilityText, 
                                disponibilidadInfo.tieneDisponibilidad 
                                    ? styles.availabilityTextAvailable 
                                    : styles.availabilityTextFull
                            ]}>
                                {disponibilidadInfo.tieneDisponibilidad ? "Disponible" : "Completo"}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* BOTONES DE ACCIÓN */}
                <View style={styles.buttonsContainer}>
                    <TouchableOpacity 
                        onPress={handleNavigateToDetails} 
                        style={[styles.buttonBase, styles.buttonPrimary]} 
                        activeOpacity={0.8}
                        disabled={!disponibilidadInfo.tieneDisponibilidad}
                    >
                        <Feather name="calendar" size={16} color="#F6EEE4" />
                        <Text style={styles.buttonText}>
                            {disponibilidadInfo.tieneDisponibilidad ? "Reservar" : "Completo"}
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