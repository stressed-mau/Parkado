// components/lib/modeloProduccion.ts

export type ResultadoProduccion = {
  personas: {
    molienda: number;
    pesado: number;
    mezclado: number;
    moldes: number;
    desmolde: number;
  };
  equipos: {
    moledoras: number;
    balanzas: number;
    moldesSugeridos: number;
    moldesUsados: number;
  };
  materiales: {
    cascara: number;
    alginato: number;
    agua: number;
  };
};

const RECETA = {
  cascara: 170,
  alginato: 18,
  agua: 150
};

// tiempos estándar (min/maceta)
const TIEMPOS = {
  pesado: 1.0,
  mezclado: 3.083,
  moldes: 0.3,
  desmolde: 0.7
};

// molienda
const CAP_MOLIENDA = 286.7; // g/min por persona

// -----------------------------
// DATOS REALES DEL PROYECTO
// ciclo 2
// 23 macetas – 140 min – 2 moldes
// -----------------------------

const BASE_MACETAS = 23;
const BASE_TIEMPO = 140;
const BASE_MOLDES = 2;

// ritmo real total
const R_BASE = BASE_MACETAS / BASE_TIEMPO; // macetas/min

// rendimiento real por molde
const R_POR_MOLDE = R_BASE / BASE_MOLDES;

// una persona puede manejar hasta 4 moldes en paralelo
const MAX_MOLDES_POR_PERSONA = 4;

export function calcularRequerimientos(
  macetasObjetivo: number,
  tiempoDisponible: number,
  moldesDisponibles?: number
): ResultadoProduccion {

  // ---------------------------------------
  // ritmo objetivo que se desea alcanzar
  // ---------------------------------------
  const rObjetivo = macetasObjetivo / tiempoDisponible;

  // ---------------------------------------
  // moldes sugeridos según rendimiento real
  // ---------------------------------------
  const moldesSugeridos = Math.max(
    1,
    Math.ceil(rObjetivo / R_POR_MOLDE)
  );

  const moldesUsados =
    moldesDisponibles && moldesDisponibles > 0
      ? moldesDisponibles
      : moldesSugeridos;

  // ---------------------------------------
  // materiales
  // ---------------------------------------
  const materiales = {
    cascara: Math.ceil(macetasObjetivo * RECETA.cascara),
    alginato: Math.ceil(macetasObjetivo * RECETA.alginato),
    agua: Math.ceil(macetasObjetivo * RECETA.agua)
  };

  // ---------------------------------------
  // personas (modelo del informe)
  // r * t   redondeado hacia arriba
  // ---------------------------------------

  const nPesado = Math.ceil(rObjetivo * TIEMPOS.pesado);

  const nMezclado = Math.ceil(rObjetivo * TIEMPOS.mezclado);

  // capacidad de atención de moldes por persona
  const capacidadMoldesPorPersona =
    MAX_MOLDES_POR_PERSONA / TIEMPOS.moldes;

  const capacidadDesmoldePorPersona =
    MAX_MOLDES_POR_PERSONA / TIEMPOS.desmolde;

  // ---------------------------------------
  // personas que atienden moldes
  // (una persona puede manejar varios moldes)
  // ---------------------------------------

  const personasParaMoldes = Math.ceil(
    moldesUsados / MAX_MOLDES_POR_PERSONA
  );

  const personasParaDesmolde = Math.ceil(
    moldesUsados / MAX_MOLDES_POR_PERSONA
  );

  // ---------------------------------------
  // molienda (flujo de material)
  // ---------------------------------------

  const consumoPorMin =
    rObjetivo * RECETA.cascara;

  const nMolienda = Math.ceil(
    consumoPorMin / CAP_MOLIENDA
  );

  // ---------------------------------------
  // equipos
  // ---------------------------------------

  const equipos = {
    moledoras: nMolienda,
    balanzas: nPesado,
    moldesSugeridos,
    moldesUsados
  };

  // ---------------------------------------
  // personas finales
  // ---------------------------------------

  const personas = {
    molienda: Math.max(1, nMolienda),
    pesado: Math.max(1, nPesado),
    mezclado: Math.max(1, nMezclado),
    moldes: Math.max(1, personasParaMoldes),
    desmolde: Math.max(1, personasParaDesmolde)
  };

  return {
    personas,
    equipos,
    materiales
  };
}
