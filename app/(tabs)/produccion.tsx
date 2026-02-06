import { useState, Fragment } from "react";
import type { ReactNode } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet
} from "react-native";

import Svg, {
  Rect,
  Text as SvgText,
  Line,
  Polygon
} from "react-native-svg";

import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5
} from "@expo/vector-icons";

import { calcularRequerimientos } from "../../components/lib/modeloProduccion";
import { Path } from "react-native-svg";

/* ===========================
   PALETA (azul – azul – azul – crema)
   =========================== */

const COLORS = {
  navy: "#1F3448",
  blue: "#5E7F99",
  lightBlue: "#A9C5D1",
  cream: "#EFE5D2",

  bg: "#F5F7F8",
  card: "#EFE5D2",
  border: "#A9C5D1",

  title: "#1F3448",
  text: "#243A4A",
  accent: "#5E7F99"
};

const PROCESS_COLORS = [
  COLORS.navy,
  COLORS.blue,
  COLORS.lightBlue,
  "#8FAEC0",
  "#3E5E73"
];

const PIE_COLORS = [
  "#fb7185", // rosado
  "#60a5fa", // azul
  "#34d399", // verde
  "#fbbf24", // amarillo
  "#c084fc"  // violeta
];


export default function ProduccionScreen() {

  const [macetas, setMacetas] = useState("50");
  const [tiempo, setTiempo] = useState("140");
  const [moldesManual, setMoldesManual] = useState("3");

  const objetivo = Number(macetas);
  const tiempoMin = Number(tiempo);

  const valido =
    objetivo > 0 &&
    tiempoMin > 0 &&
    !isNaN(objetivo) &&
    !isNaN(tiempoMin);

  const moldesParaCalculo =
    moldesManual.trim() === ""
      ? undefined
      : Number(moldesManual);

  const resultado = valido
    ? calcularRequerimientos(objetivo, tiempoMin, moldesParaCalculo)
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

  const personasLabels = ["Molienda", "Pesado", "Mezclado", "Moldeado", "Desmolde"];

  const materialesValues = resultado
    ? [
        resultado.materiales.cascara,
        resultado.materiales.alginato,
        resultado.materiales.agua
      ]
    : [0, 0, 0];

  const materialesLabels = ["Cáscara", "Alginato", "Agua"];

  const totalPersonal = personasValues.reduce((a, b) => a + b, 0);

  const eficiencia =
    totalPersonal > 0 ? objetivo / totalPersonal : 0;

  const ranking = personasLabels
    .map((l, i) => ({ label: l, value: personasValues[i] }))
    .sort((a, b) => b.value - a.value);

  const procesoCritico = ranking[0];
  const procesoMenor = ranking[ranking.length - 1];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>

      <Text style={styles.title}>Simulación de producción</Text>

      {/* INPUTS */}

      <View style={styles.rowInputs}>

        <View style={styles.card}>
          <Text style={styles.label}>Macetas</Text>
          <TextInput
            value={macetas}
            onChangeText={setMacetas}
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

      {/* KPI EXTRA */}

      <View style={styles.block}>

        <View style={styles.sectionRow}>
          <Ionicons name="speedometer" size={18} color={COLORS.title} />
          <Text style={styles.sectionText}>Indicadores rápidos</Text>
        </View>

        <View style={styles.kpis}>

          <Kpi
            icon={<Ionicons name="people" size={22} color={COLORS.accent} />}
            title="Personal total"
            value={totalPersonal}
          />

          <Kpi
            icon={<Ionicons name="trending-up" size={22} color={COLORS.accent} />}
            title="Macetas / persona"
            value={Number(eficiencia.toFixed(2))}
          />

        </View>

      </View>

      {/* BARRAS */}

      <View style={styles.block}>

        <View style={styles.sectionRow}>
          <Ionicons name="people" size={18} color={COLORS.title} />
          <Text style={styles.sectionText}>Personal por proceso</Text>
        </View>

        <VerticalBarChart
          labels={["Mol", "Pes", "Mez", "Mol", "Des"]}
          values={personasValues}
        />
      </View>

      {/* DONUT */}

      <View style={styles.block}>
        <View style={styles.sectionRow}>
          <Ionicons name="pie-chart" size={18} color={COLORS.title} />
          <Text style={styles.sectionText}>Distribución de personal</Text>
        </View>

        <PieChart
          values={personasValues}
          labels={personasLabels}
        />

      </View>

      {/* RADAR */}

      <View style={styles.block}>
        <View style={styles.sectionRow}>
          <Ionicons name="analytics" size={18} color={COLORS.title} />
          <Text style={styles.sectionText}>Perfil de carga (radar)</Text>
        </View>

        <RadarChart
          values={personasValues}
          labels={personasLabels}
        />
      </View>

      {/* RANKING */}

      <View style={styles.block}>
        <View style={styles.sectionRow}>
          <Ionicons name="list" size={18} color={COLORS.title} />
          <Text style={styles.sectionText}>Procesos</Text>
        </View>

        {ranking.map((r, i) => (
          <Text key={r.label} style={styles.simpleRow}>
            {i + 1}. {r.label}: {r.value} personas
          </Text>
        ))}
      </View>

      {/* CONCLUSIONES */}

      <View style={styles.block}>

        <View style={styles.sectionRow}>
          <Ionicons name="alert-circle" size={18} color={COLORS.title} />
          <Text style={styles.sectionText}>Conclusiones automáticas</Text>
        </View>

        {resultado && (
          <>
            <Text style={styles.simpleRow}>
              Proceso crítico: {procesoCritico.label}
            </Text>
            <Text style={styles.simpleRow}>
              Proceso con menor carga: {procesoMenor.label}
            </Text>
            <Text style={styles.simpleRow}>
              Recomendación: priorizar apoyo en {procesoCritico.label}.
            </Text>
          </>
        )}

      </View>

      {/* EQUIPOS */}

      <View style={styles.block}>

        <View style={styles.sectionRow}>
          <MaterialCommunityIcons name="factory" size={18} color={COLORS.title} />
          <Text style={styles.sectionText}>Equipos</Text>
        </View>

        <View style={styles.kpis}>

          <Kpi
            icon={<MaterialCommunityIcons name="cog" size={22} color={COLORS.accent} />}
            title="Moledoras"
            value={resultado?.equipos.moledoras ?? 0}
          />

          <Kpi
            icon={<MaterialCommunityIcons name="scale-balance" size={22} color={COLORS.accent} />}
            title="Balanzas"
            value={resultado?.equipos.balanzas ?? 0}
          />

          <Kpi
            icon={<FontAwesome5 name="cubes" size={20} color={COLORS.accent} />}
            title="Moldes usados"
            value={resultado?.equipos.moldesUsados ?? 0}
          />

        </View>

      </View>

      {/* MATERIALES */}

      <View style={styles.block}>

        <View style={styles.sectionRow}>
          <MaterialCommunityIcons name="flask" size={18} color={COLORS.title} />
          <Text style={styles.sectionText}>Material requerido</Text>
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

function Kpi({ icon, title, value }: { icon: ReactNode; title: string; value: number }) {
  return (
    <View style={styles.kpiCard}>
      {icon}
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{title}</Text>
    </View>
  );
}

/* ---------------- DONUT ---------------- */

function PieChart({ values }: { values: number[]; labels: string[] }) {

  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 90;

  const total = values.reduce((a, b) => a + b, 0);

  let startAngle = -Math.PI / 2;

  function arcPath(
    cx: number,
    cy: number,
    r: number,
    start: number,
    end: number
  ) {
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);

    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);

    const largeArc = end - start > Math.PI ? 1 : 0;

    return `
      M ${cx} ${cy}
      L ${x1} ${y1}
      A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}
      Z
    `;
  }

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={size} height={size}>

        {values.map((v, i) => {

          const angle = total === 0 ? 0 : (v / total) * Math.PI * 2;
          const endAngle = startAngle + angle;

          const d = arcPath(cx, cy, radius, startAngle, endAngle);

          startAngle = endAngle;

          return (
            <Path
              key={i}
              d={d}
              fill={PIE_COLORS[i % PIE_COLORS.length]}

            />
          );
        })}

      </Svg>
    </View>
  );
}

/* ---------------- RADAR ---------------- */

function RadarChart({ values, labels }: { values: number[]; labels: string[] }) {

  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 90;
  const max = Math.max(...values, 1);
  const angle = (2 * Math.PI) / values.length;

  const points = values.map((v, i) => {
    const r = (v / max) * radius;
    const a = i * angle - Math.PI / 2;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(" ");

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={size} height={size}>

        {values.map((_, i) => {
          const a = i * angle - Math.PI / 2;
          return (
            <Line
              key={i}
              x1={cx}
              y1={cy}
              x2={cx + radius * Math.cos(a)}
              y2={cy + radius * Math.sin(a)}
              stroke={COLORS.lightBlue}
            />
          );
        })}

        <Polygon
          points={points}
          fill={COLORS.blue}
          opacity={0.35}
          stroke={COLORS.navy}
          strokeWidth={2}
        />

        {labels.map((l, i) => {
          const a = i * angle - Math.PI / 2;
          return (
            <SvgText
              key={l}
              x={cx + (radius + 16) * Math.cos(a)}
              y={cy + (radius + 16) * Math.sin(a)}
              fontSize="11"
              fill={COLORS.text}
              textAnchor="middle"
            >
              {l}
            </SvgText>
          );
        })}

      </Svg>
    </View>
  );
}

/* ---------------- BARRAS VERTICALES ---------------- */

function VerticalBarChart({ labels, values }: { labels: string[]; values: number[] }) {

  const width = 320;
  const height = 200;

  const chartBottom = 150;
  const chartTop = 24;
  const chartHeight = chartBottom - chartTop;

  const max = Math.max(...values, 1);
  const barWidth = 22;
  const gap = 34;

  const totalWidth = values.length * barWidth + (values.length - 1) * gap;
  const startX = (width - totalWidth) / 2;

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={width} height={height}>
        {[0, 1, 2, 3].map((i) => {
          const y = chartTop + (chartHeight / 3) * i;
          return (
            <Line
              key={i}
              x1={18}
              x2={width - 18}
              y1={y}
              y2={y}
              stroke={COLORS.lightBlue}
              strokeDasharray="4 6"
            />
          );
        })}

        {values.map((v, i) => {

          const h = (v / max) * chartHeight;
          const x = startX + i * (barWidth + gap);
          const y = chartBottom - h;

          return (
            <Fragment key={i}>
              <Rect x={x} y={chartTop} width={barWidth} height={chartHeight} rx={11} fill={COLORS.cream} />
              <Rect
  x={x}
  y={y}
  width={barWidth}
  height={h}
  rx={11}
  fill={PIE_COLORS[i % PIE_COLORS.length]}
/>

              <SvgText x={x + barWidth / 2} y={y - 6} fontSize="11" fill={COLORS.text} fontWeight="800" textAnchor="middle">
                {v}
              </SvgText>
              <SvgText x={x + barWidth / 2} y={chartBottom + 20} fontSize="11" fill={COLORS.text} textAnchor="middle">
                {labels[i]}
              </SvgText>
            </Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

/* ---------------- BARRAS HORIZONTALES ---------------- */

function HorizontalBarChart({ labels, values }: { labels: string[]; values: number[] }) {

  const width = 320;
  const rowHeight = 28;
  const gap = 20;
  const leftLabel = 92;
  const barMaxWidth = 185;

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
              <SvgText x={leftLabel - 10} y={y + 19} fontSize="12" fill={COLORS.text} textAnchor="end" fontWeight="700">
                {labels[i]}
              </SvgText>

              <Rect x={leftLabel} y={y + 6} width={barMaxWidth} height={14} rx={8} fill={COLORS.cream} />
              <Rect x={leftLabel} y={y + 6} width={barWidth} height={14} rx={8} fill={COLORS.blue} />

              <SvgText x={leftLabel + barWidth + 8} y={y + 18} fontSize="11" fill={COLORS.navy} fontWeight="800">
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
    color: COLORS.title,
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
    color: COLORS.title,
    marginBottom: 6,
    fontWeight: "800"
  },

  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 10,
    color: COLORS.text,
    backgroundColor: "#ffffff"
  },

  block: {
    marginTop: 20,
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border
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
    color: COLORS.title
  },

  kpis: {
    flexDirection: "row",
    justifyContent: "space-between"
  },

  kpiCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingVertical: 16,
    marginHorizontal: 4,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border
  },

  kpiValue: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.navy
  },

  kpiLabel: {
    fontSize: 12,
    color: COLORS.text,
    marginTop: 4,
    textAlign: "center",
    fontWeight: "700"
  },

  simpleRow: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 6,
    fontWeight: "700"
  }

});
