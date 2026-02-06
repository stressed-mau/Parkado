import { useState, Fragment } from "react";
import type { ReactNode } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet
} from "react-native";

import Svg, { Rect, Text as SvgText, Line } from "react-native-svg";
import {
  Ionicons,
  MaterialCommunityIcons
} from "@expo/vector-icons";

/* ============================================================
   PALETA (la misma azul / verde / crema que venimos usando)
   ============================================================ */

const COLORS = {
  navy: "#1F3448",
  blue: "#5E7F99",
  lightBlue: "#A9C5D1",
  cream: "#EFE5D2",

  background: "#F5F7F8",
  card: "#EFE5D2",
  block: "#EFE5D2",
  border: "#A9C5D1",

  title: "#1F3448",
  text: "#243A4A",
  muted: "#7C8F9A",

  primary: "#1F3448",
  blueBar: "#5E7F99",
  blueSoft: "#A9C5D1",

  green: "#5E7F99",
  yellow: "#A9C5D1",
  purple: "#5E7F99",
  orange: "#A9C5D1",

  grid: "#A9C5D1",
  danger: "#1F3448"
};

/* ============================================================
   MODELO
   ============================================================ */

type Resultado = {
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
    moldesUsados: number;
    moldesSugeridos: number;
  };
  materiales: {
    cascara: number;
    alginato: number;
    agua: number;
  };
};

function calcularRequerimientos(
  macetas: number,
  tiempoMin: number,
  moldesDisponibles?: number
) {

  const r = macetas / tiempoMin;

  const tPes = 1.0;
  const tMez = 3.083;
  const tAce = 0.3;
  const tDes = 0.7;

  const capacidadMolienda = 286.7;
  const cascaraPorMaceta = 170;

  const personas = {
    molienda: Math.max(
      1,
      Math.ceil((r * cascaraPorMaceta) / capacidadMolienda)
    ),
    pesado: Math.max(1, Math.ceil(r * tPes)),
    mezclado: Math.max(1, Math.ceil(r * tMez)),
    moldes: Math.max(1, Math.ceil(r * tAce)),
    desmolde: Math.max(1, Math.ceil(r * tDes))
  };

  const moledoras = personas.molienda;
  const balanzas = personas.pesado;

  const moldesSugeridos = Math.max(
    1,
    Math.ceil(r * tAce * tiempoMin)
  );

  const moldesUsados =
    typeof moldesDisponibles === "number" && !isNaN(moldesDisponibles)
      ? Math.min(moldesDisponibles, moldesSugeridos)
      : moldesSugeridos;

  const materiales = {
    cascara: macetas * 170,
    alginato: macetas * 18,
    agua: macetas * 150
  };

  return {
    personas,
    equipos: {
      moledoras,
      balanzas,
      moldesUsados,
      moldesSugeridos
    },
    materiales
  };
}

/* ============================================================
   UTILIDADES
   ============================================================ */

function repartirPersonas(
  base: Resultado["personas"],
  personasGrupo: number
) {

  const procesos = ["molienda", "pesado", "mezclado", "moldes", "desmolde"] as const;

  const resultado = { ...base };

  let usados =
    resultado.molienda +
    resultado.pesado +
    resultado.mezclado +
    resultado.moldes +
    resultado.desmolde;

  if (usados >= personasGrupo) return resultado;

  let faltan = personasGrupo - usados;
  let i = 0;

  while (faltan > 0) {
    const p = procesos[i % procesos.length];
    resultado[p]++;
    faltan--;
    i++;
  }

  return resultado;
}

/* ============================================================
   PANTALLA
   ============================================================ */

export default function ProduccionScreen() {

  const [personasDisponibles, setPersonasDisponibles] = useState("10");
  const [tiempo, setTiempo] = useState("140");
  const [diasTrabajo, setDiasTrabajo] = useState("3");
  const [macetasObjetivoDia, setMacetasObjetivoDia] = useState("24");

  const personasTotales = Number(personasDisponibles);
  const tiempoMin = Number(tiempo);
  const dias = Number(diasTrabajo);
  const objetivoDia = Number(macetasObjetivoDia);

  const valido =
    personasTotales > 0 &&
    tiempoMin > 0 &&
    dias > 0 &&
    objetivoDia > 0;

  const MIN_PERSONAS_GRUPO = 5;

  const gruposRecomendados =
    valido
      ? Math.floor(personasTotales / MIN_PERSONAS_GRUPO)
      : 0;

  const personasPorGrupo =
    gruposRecomendados > 0
      ? Math.floor(personasTotales / gruposRecomendados)
      : 0;

  function capacidadGrupo(personasGrupo: number) {

    let low = 1;
    let high = 500;
    let best = 0;

    while (low <= high) {

      const mid = Math.floor((low + high) / 2);
      const r = calcularRequerimientos(mid, tiempoMin);

      const total =
        r.personas.molienda +
        r.personas.pesado +
        r.personas.mezclado +
        r.personas.moldes +
        r.personas.desmolde;

      if (total <= personasGrupo) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return best;
  }

  const objetivoPorGrupo =
    gruposRecomendados > 0
      ? Math.ceil(objetivoDia / gruposRecomendados)
      : 0;

  const maxPorGrupo =
    personasPorGrupo > 0
      ? capacidadGrupo(personasPorGrupo)
      : 0;

  const macetasPorGrupo =
    Math.min(objetivoPorGrupo, maxPorGrupo);

  const macetasTotalesDia =
    macetasPorGrupo * gruposRecomendados;

  const macetasTotalesPeriodo =
    macetasTotalesDia * dias;

  const resultadoBaseGrupo =
    macetasPorGrupo > 0
      ? calcularRequerimientos(macetasPorGrupo, tiempoMin)
      : null;

  const personasGrupo =
    resultadoBaseGrupo
      ? repartirPersonas(resultadoBaseGrupo.personas, personasPorGrupo)
      : null;

  const materialPorGrupo = resultadoBaseGrupo?.materiales;

  const materialPorPersona =
    materialPorGrupo && personasPorGrupo > 0
      ? {
          cascara: materialPorGrupo.cascara / personasPorGrupo,
          alginato: materialPorGrupo.alginato / personasPorGrupo,
          agua: materialPorGrupo.agua / personasPorGrupo
        }
      : null;

  const resultadoLinea =
    macetasTotalesDia > 0
      ? calcularRequerimientos(macetasTotalesDia, tiempoMin)
      : null;

  const personasValues = resultadoLinea
    ? [
        resultadoLinea.personas.molienda,
        resultadoLinea.personas.pesado,
        resultadoLinea.personas.mezclado,
        resultadoLinea.personas.moldes,
        resultadoLinea.personas.desmolde
      ]
    : [0, 0, 0, 0, 0];

  const materialesValues = resultadoLinea
    ? [
        resultadoLinea.materiales.cascara,
        resultadoLinea.materiales.alginato,
        resultadoLinea.materiales.agua
      ]
    : [0, 0, 0];

  const personasLabels = ["Molienda", "Pesado", "Mezcla", "Moldeado", "Desmol"];
  const materialesLabels = ["Cáscara", "Alginato", "Agua"];

  const personasUsadasDia = personasValues.reduce((a, b) => a + b, 0);

  const cargaPromedioProceso =
    personasValues.length > 0
      ? personasUsadasDia / personasValues.length
      : 0;

  const balancePersonalDia = personasTotales - personasUsadasDia;

  const cumpleObjetivo = macetasTotalesDia >= objetivoDia;

  return (
    <ScrollView style={styles.container}>

      <Text style={styles.title}>Plan diario por grupos</Text>

      {/* ENTRADAS */}

      <View style={styles.rowInputs}>
        <View style={styles.card}>
          <Text style={styles.label}>Personas disponibles</Text>
          <TextInput
            value={personasDisponibles}
            onChangeText={setPersonasDisponibles}
            keyboardType="numeric"
            style={styles.input}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Tiempo por día (min)</Text>
          <TextInput
            value={tiempo}
            onChangeText={setTiempo}
            keyboardType="numeric"
            style={styles.input}
          />
        </View>
      </View>

      <View style={styles.rowInputs}>
        <View style={styles.card}>
          <Text style={styles.label}>Días de trabajo</Text>
          <TextInput
            value={diasTrabajo}
            onChangeText={setDiasTrabajo}
            keyboardType="numeric"
            style={styles.input}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Macetas objetivo por día</Text>
          <TextInput
            value={macetasObjetivoDia}
            onChangeText={setMacetasObjetivoDia}
            keyboardType="numeric"
            style={styles.input}
          />
        </View>
      </View>

      {/* PLANIFICACIÓN */}

      <View style={styles.block}>
        <View style={styles.sectionRow}>
          <MaterialCommunityIcons name="calendar-clock" size={18} color={COLORS.primary} />
          <Text style={styles.sectionText}>Planificación según el modelo</Text>
        </View>

        <View style={styles.kpis}>
          <Kpi icon={<Ionicons name="people" size={22} color={COLORS.blueBar} />} title="Grupos" value={gruposRecomendados} />
          <Kpi icon={<MaterialCommunityIcons name="account-group" size={22} color={COLORS.blueBar} />} title="Personas por grupo" value={personasPorGrupo} />
          <Kpi icon={<MaterialCommunityIcons name="flower-poppy" size={22} color={COLORS.primary} />
} title="Macetas por grupo" value={macetasPorGrupo} />
          <Kpi icon={<Ionicons name="calendar" size={22} color={COLORS.blueBar} />} title="Macetas totales / día" value={macetasTotalesDia} />
          <Kpi icon={<Ionicons name="calendar-outline" size={22} color={COLORS.blueBar} />} title="Macetas totales periodo" value={macetasTotalesPeriodo} />
        </View>
      </View>

      {/* INDICADORES */}

      <View style={styles.block}>
        <View style={styles.sectionRow}>
          <MaterialCommunityIcons name="chart-timeline-variant" size={18} color={COLORS.primary} />
          <Text style={styles.sectionText}>Carga promedio por proceso</Text>
        </View>

        <Text style={[styles.simpleRow, { fontSize: 18, fontWeight: "800" }]}>
          {cargaPromedioProceso.toFixed(2)} personas / proceso
        </Text>
      </View>

      <View style={styles.block}>
        <View style={styles.sectionRow}>
          <Ionicons name="people-outline" size={18} color={COLORS.primary} />
          <Text style={styles.sectionText}>Balance de personal (día)</Text>
        </View>

        <Text
          style={[
            styles.simpleRow,
            {
              fontSize: 18,
              fontWeight: "800",
              color: COLORS.primary
            }
          ]}
        >
          {balancePersonalDia >= 0
            ? `Sobran ${balancePersonalDia} personas`
            : `Faltan ${Math.abs(balancePersonalDia)} personas`}
        </Text>
      </View>

      <View style={styles.block}>
        <View style={styles.sectionRow}>
          <Ionicons
            name={cumpleObjetivo ? "checkmark-circle" : "close-circle"}
            size={18}
            color={COLORS.primary}
          />
          <Text style={styles.sectionText}>Cumplimiento del objetivo diario</Text>
        </View>

        <Text
          style={[
            styles.simpleRow,
            {
              fontSize: 18,
              fontWeight: "800",
              color: COLORS.primary
            }
          ]}
        >
          {cumpleObjetivo
            ? "Se cumple el objetivo de producción"
            : "No se alcanza el objetivo de producción"}
        </Text>

        <Text style={styles.simpleRow}>
          Objetivo: {objetivoDia} – Producción real: {macetasTotalesDia}
        </Text>
      </View>

      {/* INDICADOR VISUAL */}

      <View style={styles.block}>
        <View style={styles.sectionRow}>
          <MaterialCommunityIcons name="target" size={18} color={COLORS.primary} />
          <Text style={styles.sectionText}>Indicador visual de producción</Text>
        </View>

        <GoalGauge objetivo={objetivoDia} real={macetasTotalesDia} />
      </View>

      {/* PERSONAS POR PROCESO */}

      <View style={styles.block}>
        <View style={styles.sectionRow}>
          <Ionicons name="people-circle" size={18} color={COLORS.primary} />
          <Text style={styles.sectionText}>Personas por proceso (por grupo)</Text>
        </View>

        {personasGrupo && (
          <>
            <Text style={styles.simpleRow}>Molienda: {personasGrupo.molienda}</Text>
            <Text style={styles.simpleRow}>Pesado: {personasGrupo.pesado}</Text>
            <Text style={styles.simpleRow}>Mezclado: {personasGrupo.mezclado}</Text>
            <Text style={styles.simpleRow}>Moldeado: {personasGrupo.moldes}</Text>
            <Text style={styles.simpleRow}>Desmolde: {personasGrupo.desmolde}</Text>
          </>
        )}
      </View>

      {/* MATERIALES */}

      <View style={styles.block}>
        <View style={styles.sectionRow}>
          <MaterialCommunityIcons name="flask" size={18} color={COLORS.primary} />
          <Text style={styles.sectionText}>Material por grupo (día)</Text>
        </View>

        {materialPorGrupo && (
          <>
            <Text style={styles.simpleRow}>Cáscara: {Math.round(materialPorGrupo.cascara)} g</Text>
            <Text style={styles.simpleRow}>Alginato: {Math.round(materialPorGrupo.alginato)} g</Text>
            <Text style={styles.simpleRow}>Agua: {Math.round(materialPorGrupo.agua)} g</Text>
          </>
        )}
      </View>

      <View style={styles.block}>
        <View style={styles.sectionRow}>
          <MaterialCommunityIcons name="account-hard-hat" size={18} color={COLORS.primary} />
          <Text style={styles.sectionText}>Material por persona</Text>
        </View>

        {materialPorPersona && (
          <>
            <Text style={styles.simpleRow}>Cáscara: {Math.round(materialPorPersona.cascara)} g</Text>
            <Text style={styles.simpleRow}>Alginato: {Math.round(materialPorPersona.alginato)} g</Text>
            <Text style={styles.simpleRow}>Agua: {Math.round(materialPorPersona.agua)} g</Text>
          </>
        )}
      </View>

      {/* GRÁFICOS */}

      <View style={styles.block}>
        <View style={styles.sectionRow}>
          <Ionicons name="bar-chart" size={18} color={COLORS.primary} />
          <Text style={styles.sectionText}>Personal por proceso (día)</Text>
        </View>

        <VerticalBarChart labels={personasLabels} values={personasValues} />
      </View>

      <View style={styles.block}>
        <View style={styles.sectionRow}>
          <MaterialCommunityIcons name="flask" size={18} color={COLORS.primary} />
          <Text style={styles.sectionText}>Material total del día (g)</Text>
        </View>

        <HorizontalBarChart labels={materialesLabels} values={materialesValues} />
      </View>

    </ScrollView>
  );
}

/* =====================================================
   COMPONENTES
   ===================================================== */

function Kpi({ icon, title, value }: { icon: ReactNode; title: string; value: number }) {
  return (
    <View style={styles.kpiCard}>
      {icon}
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{title}</Text>
    </View>
  );
}

/* ================= MEDIDOR ================= */

function GoalGauge({ objetivo, real }: { objetivo: number; real: number }) {

  const max = Math.max(objetivo * 1.2, real, 1);

  const pctObjetivo = Math.min(objetivo / max, 1);
  const pctReal = Math.min(real / max, 1);

  return (
    <View>

      <View style={styles.gaugeBase}>
        <View
          style={[
            styles.gaugeReal,
            { width: `${pctReal * 100}%` }
          ]}
        />

        <View
          style={[
            styles.gaugeTarget,
            { left: `${pctObjetivo * 100}%` }
          ]}
        />
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 6
        }}
      >
        <Text style={styles.gaugeText}>0</Text>
        <Text style={styles.gaugeText}>Objetivo: {objetivo}</Text>
        <Text style={styles.gaugeText}>Real: {real}</Text>
      </View>

    </View>
  );
}

/* =====================================================
   GRÁFICOS
   ===================================================== */

function VerticalBarChart({ labels, values }: { labels: string[]; values: number[] }) {

  const width = 320;
  const height = 190;

  const chartBottom = 145;
  const chartTop = 20;
  const chartHeight = chartBottom - chartTop;

  const max = Math.max(...values, 1);
  const barWidth = 34;
  const gap = 22;

  const totalWidth = values.length * barWidth + (values.length - 1) * gap;
  const startX = (width - totalWidth) / 2;

  const barColors = [
    COLORS.primary,
    COLORS.blueBar,
    COLORS.lightBlue,
    COLORS.blueBar,
    COLORS.primary
  ];

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={width} height={height}>
        {[...Array(4)].map((_, i) => {
          const y = chartTop + (chartHeight / 3) * i;
          return (
            <Line key={i} x1={0} x2={width} y1={y} y2={y} stroke={COLORS.grid} />
          );
        })}

        {values.map((v, i) => {
          const h = (v / max) * chartHeight;
          const x = startX + i * (barWidth + gap);
          const y = chartBottom - h;

          return (
            <Fragment key={i}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={h}
                rx={10}
                fill={barColors[i % barColors.length]}
              />
              <SvgText
                x={x + barWidth / 2}
                y={y - 6}
                fontSize="11"
                fill={COLORS.text}
                textAnchor="middle"
              >
                {v}
              </SvgText>
              <SvgText
                x={x + barWidth / 2}
                y={chartBottom + 16}
                fontSize="11"
                fill={COLORS.text}
                textAnchor="middle"
              >
                {labels[i]}
              </SvgText>
            </Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

function HorizontalBarChart({ labels, values }: { labels: string[]; values: number[] }) {

  const width = 320;
  const rowHeight = 34;
  const gap = 14;
  const leftLabel = 90;
  const barMaxWidth = 190;

  const max = Math.max(...values, 1);
  const height = values.length * (rowHeight + gap) + 10;

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={width} height={height}>
        {values.map((v, i) => {
          const barWidth = (v / max) * barMaxWidth;
          const y = i * (rowHeight + gap);

          return (
            <Fragment key={i}>
              <SvgText
                x={leftLabel - 8}
                y={y + 22}
                fontSize="12"
                fill={COLORS.text}
                textAnchor="end"
              >
                {labels[i]}
              </SvgText>

              <Rect
                x={leftLabel}
                y={y + 4}
                width={barMaxWidth}
                height={20}
                rx={10}
                fill={COLORS.lightBlue}
              />

              <Rect
                x={leftLabel}
                y={y + 4}
                width={barWidth}
                height={20}
                rx={10}
                fill={COLORS.blueBar}
              />

              <SvgText
                x={leftLabel + barWidth + 6}
                y={y + 20}
                fontSize="11"
                fill={COLORS.text}
              >
                {Math.round(v)} g
              </SvgText>
            </Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

/* =====================================================
   ESTILOS
   ===================================================== */

const styles = StyleSheet.create({

  container: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.background
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.title,
    marginBottom: 14
  },

  rowInputs: {
    flexDirection: "row",
    gap: 12
  },

  card: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border
  },

  label: {
    color: COLORS.text,
    fontWeight: "600",
    marginBottom: 6
  },

  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#ffffff",
    color: COLORS.text
  },

  block: {
    marginTop: 18,
    backgroundColor: COLORS.block,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border
  },

  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10
  },

  sectionText: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.title
  },

  kpis: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },

  kpiCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border
  },

  kpiValue: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.primary
  },

  kpiLabel: {
    fontSize: 12,
    color: COLORS.text,
    marginTop: 2,
    textAlign: "center"
  },

  simpleRow: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 6,
    fontWeight: "600"
  },

  gaugeBase: {
    width: "100%",
    height: 16,
    backgroundColor: COLORS.lightBlue,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative"
  },

  gaugeReal: {
    height: 16,
    backgroundColor: COLORS.blueBar,
    borderRadius: 10
  },

  gaugeTarget: {
    position: "absolute",
    top: -4,
    width: 3,
    height: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 2
  },

  gaugeText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text
  }

});
