export type Requerimientos = {
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
  };

  materiales: {
    cascara: number;
    alginato: number;
    agua: number;
  };
};

/*
Constantes de tu modelo (las mismas que usabas en web)
*/

const CONSUMO = {
  cascara: 170,
  alginato: 18,
  agua: 150
};

// tiempos por maceta (min)
const TIEMPOS = {
  pesado: 1.0,
  mezclado: 3.083,
  moldes: 0.3,
  desmolde: 0.7
};

// molienda está ligada a gramos
const MOLIENDA_G_POR_MIN = 286.7;

/*
--------------------------------------------------
Entrada:
  macetasObjetivo
  tiempoDisponible (min)
--------------------------------------------------
*/

export function calcularRequerimientos(
  macetas: number,
  tiempo: number
): Requerimientos {

  // -------------------------
  // PERSONAS NECESARIAS
  // -------------------------

  const personasPesado =
    Math.ceil((macetas * TIEMPOS.pesado) / tiempo);

  const personasMezclado =
    Math.ceil((macetas * TIEMPOS.mezclado) / tiempo);

  const personasMoldes =
    Math.ceil((macetas * TIEMPOS.moldes) / tiempo);

  const personasDesmolde =
    Math.ceil((macetas * TIEMPOS.desmolde) / tiempo);

  const gramosTotales =
    macetas * CONSUMO.cascara;

  const personasMolienda =
    Math.ceil(gramosTotales / (MOLIENDA_G_POR_MIN * tiempo));

  // -------------------------
  // EQUIPOS
  // -------------------------
  // En tu planta:
  // una balanza por puesto de pesado
  // una moledora por puesto de molienda
  // y los moldes se calculan por capacidad
  //
  // fórmula inversa de:
  // capacidad = moldes * tiempo / 0.3
  //
  // => moldes = macetas * 0.3 / tiempo

  const moldesSugeridos =
    Math.max(
      1,
      Math.ceil((macetas * TIEMPOS.moldes) / tiempo)
    );

  // -------------------------
  // MATERIALES
  // -------------------------

  const cascara = macetas * CONSUMO.cascara;
  const alginato = macetas * CONSUMO.alginato;
  const agua = macetas * CONSUMO.agua;

  return {
    personas: {
      molienda: personasMolienda,
      pesado: personasPesado,
      mezclado: personasMezclado,
      moldes: personasMoldes,
      desmolde: personasDesmolde
    },

    equipos: {
      moledoras: personasMolienda,
      balanzas: personasPesado,
      moldesSugeridos
    },

    materiales: {
      cascara,
      alginato,
      agua
    }
  };
}
