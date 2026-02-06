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

/* =========================
   PALETA
========================= */

const COLORS = {
  bg: "#fff7ed",
  card: "#ffffff",
  primary: "#9f1239",
  secondary: "#7c2d12",
  accent: "#fb7185",
  accentSoft: "#fda4af",
  blue: "#60a5fa",
  blueSoft: "#93c5fd",
  border: "#fed7aa",
  soft: "#ffedd5",
  textDark: "#7c2d12",
  grid: "#fde68a"
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

  const alcanza = totalPersonal <= personas;
  const balancePersonal = personas - totalPersonal;

  const tiempoPorMaceta =
    macetasRecomendadas > 0
      ? tiempoMin / macetasRecomendadas
      : 0;

  const totalMaterial =
    materialesValues[0] +
    materialesValues[1] +
    materialesValues[2];

  const proporcionMateriales = materialesValues.map(v =>
    totalMaterial > 0 ? (v / totalMaterial) * 100 : 0
  );

  const macetasConUnaPersonaMas =
    valido
      ? calcularMacetasRecomendadas(
          personas + 1,
          tiempoMin,
          moldesParaCalculo
        )
      : 0;

  const intensidadProcesos = personasValues.map(v =>
    totalPersonal > 0 ? v / totalPersonal : 0
  );

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

      {/* KPIS */}

      <View style={styles.block}>

        <View style={styles.sectionRow}>
          <MaterialCommunityIcons name="factory" size={18} color={COLORS.secondary} />
          <Text style={styles.sectionText}>Equipos y personal</Text>
        </View>

        <View style={styles.kpis}>

          <Kpi
            icon={<MaterialCommunityIcons name="cog" size={24} color={COLORS.blue} />}
            title="Moledoras"
            value={resultado?.equipos.moledoras ?? 0}
          />

          <Kpi
            icon={<MaterialCommunityIcons name="scale-balance" size={24} color={COLORS.blue} />}
            title="Balanzas"
            value={resultado?.equipos.balanzas ?? 0}
          />

          <Kpi
            icon={<FontAwesome5 name="cubes" size={22} color={COLORS.blue} />}
            title="Moldes usados"
            value={resultado?.equipos.moldesUsados ?? 0}
          />

          <Kpi
            icon={<Ionicons name="people-circle" size={26} color={COLORS.blue} />}
            title="Personal total"
            value={totalPersonal}
          />

          <Kpi
            icon={<MaterialCommunityIcons name="flower-pot" size={24} color={COLORS.blue} />}
            title="Macetas recomendadas"
            value={macetasRecomendadas}
          />

        </View>
      </View>

      {/* FACTIBILIDAD */}

      <View style={styles.block}>
        <View style={styles.sectionRow}>
          <Ionicons
            name={alcanza ? "checkmark-circle" : "close-circle"}
            size={18}
            color={alcanza ? "#16a34a" : "#dc2626"}
          />
          <Text style={styles.sectionText}>Estado de factibilidad</Text>
        </View>

        <Text style={{ fontSize: 16, fontWeight: "800", color: COLORS.secondary }}>
          {alcanza
            ? "La producción es viable con el personal disponible"
            : "No es viable con el personal actual"}
        </Text>
      </View>

      {/* BALANCE */}

      <View style={styles.block}>
        <View style={styles.sectionRow}>
          <Ionicons name="people-outline" size={18} color={COLORS.secondary} />
          <Text style={styles.sectionText}>Balance de personal</Text>
        </View>

        <Text style={{ fontSize: 18, fontWeight: "800", color: COLORS.primary }}>
          {balancePersonal >= 0
            ? `Sobran ${balancePersonal} personas`
            : `Faltan ${Math.abs(balancePersonal)} personas`}
        </Text>
      </View>

      {/* RENDIMIENTO */}

      <View style={styles.block}>
        <View style={styles.sectionRow}>
          <Ionicons name="time-outline" size={18} color={COLORS.secondary} />
          <Text style={styles.sectionText}>Rendimiento temporal</Text>
        </View>

        <Text style={{ fontSize: 18, fontWeight: "900", color: COLORS.blue }}>
          {tiempoPorMaceta.toFixed(2)} min / maceta
        </Text>
      </View>

      {/* PROPORCIÓN */}

      <View style={styles.block}>
        <View style={styles.sectionRow}>
          <MaterialCommunityIcons name="chart-pie" size={18} color={COLORS.secondary} />
          <Text style={styles.sectionText}>Proporción de materiales</Text>
        </View>

        {materialesLabels.map((l, i) => (
          <Text key={l} style={{ fontWeight: "700", color: COLORS.secondary }}>
            {l}: {proporcionMateriales[i].toFixed(1)} %
          </Text>
        ))}
      </View>

      {/* +1 PERSONA */}

      <View style={styles.block}>
        <View style={styles.sectionRow}>
          <Ionicons name="add-circle-outline" size={18} color={COLORS.secondary} />
          <Text style={styles.sectionText}>Escenario +1 persona</Text>
        </View>

        <Text style={{ fontSize: 18, fontWeight: "900", color: COLORS.primary }}>
          {macetasConUnaPersonaMas} macetas
        </Text>
      </View>

      {/* INTENSIDAD */}

      <View style={styles.block}>
        <View style={styles.sectionRow}>
          <Ionicons name="pulse" size={18} color={COLORS.secondary} />
          <Text style={styles.sectionText}>Intensidad de trabajo</Text>
        </View>

        {personasLabels.map((l, i) => (
          <View key={l} style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: COLORS.secondary }}>
              {l}
            </Text>
            <View
              style={{
                height: 6,
                backgroundColor: COLORS.soft,
                borderRadius: 4
              }}
            >
              <View
                style={{
                  width: `${(intensidadProcesos[i] * 100).toFixed(0)}%`,
                  height: 6,
                  borderRadius: 4,
                  backgroundColor: COLORS.accent
                }}
              />
            </View>
          </View>
        ))}
      </View>

      {/* ETAPAS */}

      <View style={styles.block}>
        <View style={styles.sectionRow}>
          <Ionicons name="list" size={18} color={COLORS.secondary} />
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
          <Ionicons name="people" size={18} color={COLORS.secondary} />
          <Text style={styles.sectionText}>Personal por proceso</Text>
        </View>

        <VerticalBarChart labels={personasLabels} values={personasValues} />
      </View>

      {/* MATERIALES */}

      <View style={styles.block}>
        <View style={styles.sectionRow}>
          <MaterialCommunityIcons name="flask" size={18} color={COLORS.secondary} />
          <Text style={styles.sectionText}>Material requerido (g)</Text>
        </View>

        <HorizontalBarChart labels={materialesLabels} values={materialesValues} />
      </View>

    </ScrollView>
  );
}

/* ---------------- KPI ---------------- */

function Kpi({ icon, title, value }: { icon: ReactNode; title: string; value: number }) {
  return (
    <View style={styles.kpiCard}>
      {icon}
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{title}</Text>
    </View>
  );
}

/* ---------------- GRÁFICOS ---------------- */

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
              <Rect x={x} y={y} width={barWidth} height={h} rx={10} fill={COLORS.accent} />
              <SvgText x={x + barWidth / 2} y={y - 6} fontSize="11" fill={COLORS.primary} textAnchor="middle">
                {v}
              </SvgText>
              <SvgText x={x + barWidth / 2} y={chartBottom + 16} fontSize="11" fill={COLORS.secondary} textAnchor="middle">
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
              <SvgText x={leftLabel - 8} y={y + 22} fontSize="12" fill={COLORS.secondary} textAnchor="end">
                {labels[i]}
              </SvgText>

              <Rect x={leftLabel} y={y + 4} width={barMaxWidth} height={20} rx={10} fill={COLORS.soft} />

              <Rect x={leftLabel} y={y + 4} width={barWidth} height={20} rx={10} fill={COLORS.blue} />

              <SvgText x={leftLabel + barWidth + 6} y={y + 20} fontSize="11" fill={COLORS.primary}>
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
    backgroundColor: COLORS.bg,
    padding: 16
  },

  title: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.primary,
    marginBottom: 16
  },

  rowInputs: {
    flexDirection: "row",
    gap: 12
  },

  card: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border
  },

  label: {
    color: COLORS.primary,
    marginBottom: 6,
    fontWeight: "800"
  },

  input: {
    borderWidth: 1,
    borderColor: "#fdba74",
    borderRadius: 12,
    padding: 10,
    color: COLORS.secondary,
    backgroundColor: COLORS.bg
  },

  block: {
    marginTop: 20,
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#fde68a"
  },

  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12
  },

  sectionText: {
    marginLeft: 8,
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.secondary
  },

  kpis: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },

  kpiCard: {
    width: "48%",
    backgroundColor: COLORS.bg,
    borderRadius: 18,
    paddingVertical: 16,
    marginBottom: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border
  },

  kpiValue: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.blue
  },

  kpiLabel: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 4,
    textAlign: "center",
    fontWeight: "700"
  },

  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10
  },

  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10
  },

  stepNumber: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900"
  },

  stepText: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: "700"
  }

});
