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
  MaterialCommunityIcons,
  FontAwesome5
} from "@expo/vector-icons";

/* ============================================================
   MODELO (antes estaba en ../../components/lib/modeloProduccion)
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

/*
  Modelo simple y coherente con tu UI.
  Todas las fórmulas se pueden ajustar luego
  sin tocar la pantalla.
*/
function calcularRequerimientos(
  macetas: number,
  tiempoMin: number,
  moldesDisponibles?: number
) {

  const r = macetas / tiempoMin; // macetas por minuto

  // ---- tiempos estándar (min/maceta) - informe
  const tPes = 1.0;
  const tMez = 3.083;
  const tAce = 0.3;
  const tDes = 0.7;

  // ---- molienda por capacidad (g/min)
  const capacidadMolienda = 286.7; // g/min por persona
  const cascaraPorMaceta = 170;    // g

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
   PANTALLA
   ============================================================ */

const ETAPAS = [
  "Molienda",
  "Pesado",
  "Mezclado",
  "Moldeado",
  "Desmolde"
];

export default function ProduccionScreen() {

  const [personasDisponibles, setPersonasDisponibles] = useState("6");
  const [tiempo, setTiempo] = useState("140");
  const [moldesManual, setMoldesManual] = useState("3");

  const personas = Number(personasDisponibles);
  const tiempoMin = Number(tiempo);

  const valido =
    personas > 0 &&
    tiempoMin > 0 &&
    !isNaN(personas) &&
    !isNaN(tiempoMin);

  const moldesParaCalculo =
    moldesManual.trim() === ""
      ? undefined
      : Number(moldesManual);

  function calcularMacetasRecomendadas(
    personasDisponibles: number,
    tiempoMin: number,
    moldes?: number
  ) {

    if (personasDisponibles <= 0 || tiempoMin <= 0) return 0;

    let low = 1;
    let high = 10000;
    let best = 0;

    while (low <= high) {

      const mid = Math.floor((low + high) / 2);
      const r = calcularRequerimientos(mid, tiempoMin, moldes);

      const total =
        r.personas.molienda +
        r.personas.pesado +
        r.personas.mezclado +
        r.personas.moldes +
        r.personas.desmolde;

      if (total <= personasDisponibles) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return best;
  }

  const macetasRecomendadas = valido
    ? calcularMacetasRecomendadas(
        personas,
        tiempoMin,
        moldesParaCalculo
      )
    : 0;

  const resultado =
    valido && macetasRecomendadas > 0
      ? calcularRequerimientos(
          macetasRecomendadas,
          tiempoMin,
          moldesParaCalculo
        )
      : null;

  const personasValues = resultado
    ? [
        resultado.personas.molienda,
        resultado.personas.pesado,
        resultado.personas.mezclado,
        resultado.personas.moldes,
        resultado.personas.desmolde
      ]
    : [0, 0, 0, 0, 0];

  const totalPersonal = personasValues.reduce((a, b) => a + b, 0);

  const materialesValues = resultado
    ? [
        resultado.materiales.cascara,
        resultado.materiales.alginato,
        resultado.materiales.agua
      ]
    : [0, 0, 0];

  const personasLabels = ["Molienda", "Pesado", "Mezcla", "Moldeado", "Desmol"];
  const materialesLabels = ["Cáscara", "Alginato", "Agua"];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >

      <Text style={styles.title}>Plan de producción</Text>

      {/* INPUTS */}

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
          <Text style={styles.label}>Tiempo (min)</Text>
          <TextInput
            value={tiempo}
            onChangeText={setTiempo}
            keyboardType="numeric"
            style={styles.input}
          />
        </View>

      </View>

      <View style={styles.card}>
        <Text style={styles.label}>
          Moldes disponibles (sugerido {resultado?.equipos.moldesSugeridos ?? 0})
        </Text>

        <TextInput
          value={moldesManual}
          onChangeText={setMoldesManual}
          keyboardType="numeric"
          style={styles.input}
        />
      </View>

      {/* EQUIPOS + PERSONAL TOTAL */}

      <View style={styles.block}>

        <View style={styles.sectionRow}>
          <MaterialCommunityIcons name="factory" size={18} color="#065f46" />
          <Text style={styles.sectionText}>Equipos y personal</Text>
        </View>

        <View style={styles.kpis}>

          <Kpi
            icon={
              <MaterialCommunityIcons
                name="cog"
                size={24}
                color="#059669"
                style={{ marginBottom: 4 }}
              />
            }
            title="Moledoras"
            value={resultado?.equipos.moledoras ?? 0}
          />

          <Kpi
            icon={
              <MaterialCommunityIcons
                name="scale-balance"
                size={24}
                color="#059669"
                style={{ marginBottom: 4 }}
              />
            }
            title="Balanzas"
            value={resultado?.equipos.balanzas ?? 0}
          />

          <Kpi
            icon={
              <FontAwesome5
                name="cubes"
                size={22}
                color="#059669"
                style={{ marginBottom: 4 }}
              />
            }
            title="Moldes usados"
            value={resultado?.equipos.moldesUsados ?? 0}
          />

          <Kpi
            icon={
              <Ionicons
                name="people-circle"
                size={26}
                color="#059669"
                style={{ marginBottom: 4 }}
              />
            }
            title="Personal total"
            value={totalPersonal}
          />

          <Kpi
            icon={
              <MaterialCommunityIcons
                name="flower-pot"
                size={24}
                color="#059669"
                style={{ marginBottom: 4 }}
              />
            }
            title="Macetas recomendadas"
            value={macetasRecomendadas}
          />

        </View>
      </View>

      {/* ETAPAS */}

      <View style={styles.block}>

        <View style={styles.sectionRow}>
          <Ionicons name="list" size={18} color="#065f46" />
          <Text style={styles.sectionText}>Etapas del proceso</Text>
        </View>

        {ETAPAS.map((etapa, i) => (
          <View key={etapa} style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNumber}>{i + 1}</Text>
            </View>
            <Text style={styles.stepText}>{etapa}</Text>
          </View>
        ))}

      </View>

      {/* PERSONAL */}

      <View style={styles.block}>

        <View style={styles.sectionRow}>
          <Ionicons name="people" size={18} color="#065f46" />
          <Text style={styles.sectionText}>Personal por proceso</Text>
        </View>

        <VerticalBarChart
          labels={personasLabels}
          values={personasValues}
        />
      </View>

      {/* MATERIALES */}

      <View style={styles.block}>

        <View style={styles.sectionRow}>
          <MaterialCommunityIcons name="flask" size={18} color="#065f46" />
          <Text style={styles.sectionText}>Material requerido (g)</Text>
        </View>

        <HorizontalBarChart
          labels={materialesLabels}
          values={materialesValues}
        />
      </View>

    </ScrollView>
  );
}

/* ---------------- KPI ---------------- */

function Kpi({
  icon,
  title,
  value
}: {
  icon: ReactNode;
  title: string;
  value: number;
}) {
  return (
    <View style={styles.kpiCard}>
      {icon}
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{title}</Text>
    </View>
  );
}

/* ---------------- PERSONAL ---------------- */

function VerticalBarChart({
  labels,
  values
}: {
  labels: string[];
  values: number[];
}) {

  const width = 320;
  const height = 190;

  const chartBottom = 145;
  const chartTop = 20;
  const chartHeight = chartBottom - chartTop;

  const max = Math.max(...values, 1);
  const barWidth = 34;
  const gap = 22;

  const totalWidth =
    values.length * barWidth +
    (values.length - 1) * gap;

  const startX = (width - totalWidth) / 2;

  return (
    <View style={{ alignItems: "center" }}>

      <Svg width={width} height={height}>

        {[...Array(4)].map((_, i) => {
          const y = chartTop + (chartHeight / 3) * i;
          return (
            <Line
              key={`grid-${i}`}
              x1={0}
              x2={width}
              y1={y}
              y2={y}
              stroke="#bbf7d0"
              strokeWidth={1}
            />
          );
        })}

        {values.map((v, i) => {

          const h = (v / max) * chartHeight;
          const x = startX + i * (barWidth + gap);
          const y = chartBottom - h;

          return (
            <Fragment key={`bar-${i}`}>

              <Rect
                x={x}
                y={y + 4}
                width={barWidth}
                height={h}
                rx={10}
                fill="#000"
                opacity={0.06}
              />

              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={h}
                rx={10}
                fill="#10b981"
              />

              <SvgText
                x={x + barWidth / 2}
                y={y - 6}
                fontSize="11"
                fill="#065f46"
                fontWeight="700"
                textAnchor="middle"
              >
                {v}
              </SvgText>

              <SvgText
                x={x + barWidth / 2}
                y={chartBottom + 16}
                fontSize="11"
                fill="#374151"
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

/* ---------------- MATERIALES ---------------- */

function HorizontalBarChart({
  labels,
  values
}: {
  labels: string[];
  values: number[];
}) {

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
            <Fragment key={`hbar-${i}`}>

              <SvgText
                x={leftLabel - 8}
                y={y + 22}
                fontSize="12"
                fill="#065f46"
                textAnchor="end"
                fontWeight="600"
              >
                {labels[i]}
              </SvgText>

              <Rect
                x={leftLabel}
                y={y + 4}
                width={barWidth}
                height={20}
                rx={10}
                fill="#10b981"
              />

              <SvgText
                x={leftLabel + barWidth + 6}
                y={y + 20}
                fontSize="11"
                fill="#065f46"
                fontWeight="700"
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

/* ---------------- ESTILOS ---------------- */

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 16
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#064e3b",
    marginBottom: 14
  },

  rowInputs: {
    flexDirection: "row",
    gap: 12
  },

  card: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#d1fae5"
  },

  label: {
    color: "#065f46",
    marginBottom: 6,
    fontWeight: "600"
  },

  input: {
    borderWidth: 1,
    borderColor: "#a7f3d0",
    borderRadius: 10,
    padding: 10,
    color: "#064e3b",
    backgroundColor: "#ffffff"
  },

  block: {
    marginTop: 18,
    backgroundColor: "#ecfdf5",
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#10b981"
  },

  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12
  },

  sectionText: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: "700",
    color: "#065f46"
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
    borderColor: "#a7f3d0"
  },

  kpiValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#047857"
  },

  kpiLabel: {
    fontSize: 12,
    color: "#374151",
    marginTop: 2,
    textAlign: "center"
  },

  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8
  },

  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8
  },

  stepNumber: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700"
  },

  stepText: {
    color: "#064e3b",
    fontSize: 14,
    fontWeight: "600"
  }

});
