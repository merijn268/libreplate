import {
  PieChart,
  Pie,
  ResponsiveContainer,
  Legend,
  Tooltip,
  Cell,
} from "recharts";

type Props = {
  protein: number;
  fat: number;
  carbs: number;
};

const COLORS = {
  F: "#f8a922",
  C: "#292ce3",
  P: "#0e9b42",
};

export default function MacroPieChart({ protein, fat, carbs }: Props) {
  const data = [
    {
      name: "F",
      value: fat * 9,
    },
    {
      name: "C",
      value: carbs * 4,
    },
    {
      name: "P",
      value: protein * 4,
    },
  ].filter((item) => item.value > 0);

  const totalCalories = data.reduce((sum, item) => sum + item.value, 0);

  if (totalCalories === 0) {
    return (
      <div className="text-muted small text-center">
        No macro data available
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: 210 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
          >
            {data.map((item) => (
              <Cell
                key={item.name}
                fill={COLORS[item.name as keyof typeof COLORS]}
              />
            ))}
          </Pie>

          <Tooltip
            formatter={(value) => {
              const kcal =
                typeof value === "number" ? value : Number(value ?? 0);

              return `${kcal.toFixed(0)} kcal`;
            }}
          />

          <Legend
            formatter={(value) => {
              const item = data.find((entry) => entry.name === value);

              if (!item) {
                return value;
              }

              const percentage = (item.value / totalCalories) * 100;

              return `${value} ${percentage.toFixed(0)}%`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
