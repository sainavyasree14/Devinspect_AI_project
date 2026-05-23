import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  Activity,
  Bug,
  Code2,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Award
} from "lucide-react";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { getReviewsFromServer, normalizeMode, computeAiScore } from "@/lib/historyStorage";
import StreakCard from "@/components/StreakCard";
import { DashboardSkeleton } from "@/components/LoadingSkeleton";
import { useTranslation } from "react-i18next";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const DashboardPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getReviewsFromServer();
        setReviews(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statsCalculated = useMemo(() => {
    const modeCounts = { student: 0, interviewer: 0, developer: 0 };
    let totalIssues = 0;
    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;
    let totalScoreSum = 0;

    reviews.forEach((review) => {
      const mode = normalizeMode(review.mode);
      if (modeCounts[mode] !== undefined) {
        modeCounts[mode] += 1;
      }
      const errs = review.errors || [];
      totalIssues += errs.length;
      totalScoreSum += review.aiScore || 100;

      errs.forEach(e => {
        const sev = String(e.severity || '').toLowerCase();
        if (sev.includes('critical')) criticalCount++;
        else if (sev.includes('high')) highCount++;
        else if (sev.includes('medium')) mediumCount++;
        else lowCount++;
      });
    });

    const avgScore = reviews.length
      ? Math.round(totalScoreSum / reviews.length)
      : 100;

    const languageCounts = reviews.reduce((acc, review) => {
      const lang = (review.language || "unknown").toLowerCase();
      acc[lang] = (acc[lang] || 0) + 1;
      return acc;
    }, {});

    const topLanguage =
      Object.entries(languageCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      "—";

    return {
      totalAnalyses: reviews.length,
      modeCounts,
      recentActivity: reviews.slice(0, 6),
      totalIssues,
      avgScore,
      topLanguage,
      severities: {
        critical: criticalCount,
        high: highCount,
        medium: mediumCount,
        low: lowCount
      }
    };
  }, [reviews]);

  const stats = useMemo(
    () => [
      {
        title: t('dashboard.totalAnalyses'),
        value: String(statsCalculated.totalAnalyses),
        icon: Code2,
        color: "text-rose-500",
      },
      {
        title: t('dashboard.totalIssues'),
        value: String(statsCalculated.totalIssues),
        icon: Bug,
        color: "text-amber-500",
      },
      {
        title: t('dashboard.avgScore'),
        value: `${statsCalculated.avgScore}%`,
        icon: TrendingUp,
        color: "text-teal-500",
      },
      {
        title: t('dashboard.topLanguage'),
        value: statsCalculated.topLanguage.toUpperCase(),
        icon: Sparkles,
        color: "text-indigo-500",
      },
    ],
    [statsCalculated, t]
  );

  const pieData = useMemo(
    () => ({
      labels: ["Student", "Interviewer", "Developer"],
      datasets: [
        {
          data: [
            statsCalculated.modeCounts.student,
            statsCalculated.modeCounts.interviewer,
            statsCalculated.modeCounts.developer,
          ],
          // Use explicit hex colors — CSS variables don't resolve inside Chart.js canvas
          backgroundColor: ["#6366f1", "#ec4899", "#14b8a6"],
          hoverBackgroundColor: ["#818cf8", "#f472b6", "#2dd4bf"],
          borderWidth: 0,
        },
      ],
    }),
    [statsCalculated.modeCounts]
  );

  const barData = useMemo(
    () => ({
      labels: ["Critical", "High", "Medium", "Low"],
      datasets: [
        {
          label: "Issues by Severity",
          data: [
            statsCalculated.severities.critical,
            statsCalculated.severities.high,
            statsCalculated.severities.medium,
            statsCalculated.severities.low,
          ],
          backgroundColor: ["#ef4444", "#f97316", "#eab308", "#3b82f6"],
          borderRadius: 8,
        },
      ],
    }),
    [statsCalculated.severities]
  );

  const formatRelativeTime = (timestamp) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

  return (
    <>
      <Helmet>
        <title>Dashboard | DevInspectAI</title>
      </Helmet>

      <div className="min-h-screen p-6 lg:p-10 text-foreground bg-background">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-3">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shadow-lg"
            >
              <Sparkles className="text-primary w-6 h-6 animate-pulse" />
            </motion.div>
            <h1 className="text-4xl font-extrabold text-gradient">
              {t('dashboard.title')}
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            {t('dashboard.subtitle')}
          </p>
        </motion.div>

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
              {stats.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: index * 0.1, type: "spring" }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="card-glass p-6 rounded-2xl border border-border/30 shadow-md flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-muted border border-border/30 flex items-center justify-center shadow-sm">
                      <Icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-0.5">
                        {item.title}
                      </p>
                      <h2 className="text-2xl font-black text-gradient">{item.value}</h2>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-10">
              
              {/* Severity Bar Chart */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                className="xl:col-span-8 card-glass p-8 rounded-3xl"
              >
                <div className="flex items-center gap-2 mb-6">
                  <AlertTriangle className="text-amber-500 w-5 h-5" />
                  <h3 className="text-xl font-bold">Severity Analysis</h3>
                </div>
                <div className="w-full max-h-[300px]">
                  <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </motion.div>

              {/* Mode Usage Pie Chart */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                className="xl:col-span-4 card-glass p-8 rounded-3xl"
              >
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Award className="text-primary w-5 h-5" /> Mode Breakdown
                </h3>
                {statsCalculated.totalAnalyses === 0 ? (
                  <p className="text-muted-foreground italic text-center py-10">No mode usage data available.</p>
                ) : (
                  <div className="max-w-[200px] mx-auto">
                    <Pie data={pieData} />
                  </div>
                )}
              </motion.div>
            </div>

            {/* Streak Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
              <StreakCard />
            </div>

            <div className="grid grid-cols-1 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-glass p-8 rounded-3xl"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-primary/20">
                    <Activity className="text-primary w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-bold">{t('dashboard.recentReviews')}</h2>
                </div>

                <div className="space-y-3">
                  {statsCalculated.recentActivity.length === 0 ? (
                    <p className="text-muted-foreground italic text-center py-6">
                      Run your first review in the Analyzer page to show recent activity.
                    </p>
                  ) : (
                    statsCalculated.recentActivity.map((item) => (
                      <motion.div
                        key={item.id}
                        whileHover={{ x: 5 }}
                        className="p-4 rounded-xl bg-muted/30 border border-border/30 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="capitalize font-bold text-sm bg-primary/10 text-primary px-3 py-1 rounded-md">
                            {item.language}
                          </div>
                          <span className="text-foreground font-semibold text-sm capitalize">
                            {item.mode} review · Score: {item.aiScore}%
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(item.timestamp)}
                        </span>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default DashboardPage;