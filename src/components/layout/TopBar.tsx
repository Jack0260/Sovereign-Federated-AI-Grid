import { useSovereignStore } from '@/store/SovereignContext';
import { useSovereignStore as useStore } from '@/store/SovereignContext';
import { cn } from '@/lib/cn';
import { Play, Square, RotateCcw, Sun, Moon, Activity, Cpu, Leaf } from 'lucide-react';
import { MobileMenuButton } from './Sidebar';

interface TopBarProps {
  onMobileMenuOpen: () => void;
  title: string;
  subtitle?: string;
}

export function TopBar({ onMobileMenuOpen, title, subtitle }: TopBarProps) {
  const theme = useSovereignStore((s) => s.theme);
  const toggleTheme = useSovereignStore((s) => s.toggleTheme);
  const isTraining = useStore((s) => s.isTraining);
  const startTrainingRound = useStore((s) => s.startTrainingRound);
  const resetFederation = useStore((s) => s.resetFederation);
  const rounds = useStore((s) => s.rounds);
  const carbonReports = useStore((s) => s.carbonReports);

  const totalCarbon = carbonReports.reduce((sum, r) => sum + r.carbonKg, 0);
  const greenEnergyPct = carbonReports.length > 0
    ? Math.round((carbonReports.filter((r) => ['solar', 'wind', 'hydro', 'nuclear'].includes(r.energySource)).length / carbonReports.length) * 100)
    : 0;

  return (
    <header className="sticky top-0 z-30 h-14 bg-white/80 dark:bg-secondary-900/80 backdrop-blur-md border-b border-secondary-200 dark:border-secondary-800 flex items-center gap-3 px-4">
      <MobileMenuButton onClick={onMobileMenuOpen} />

      <div className="flex-1 min-w-0">
        <h2 className="text-sm font-semibold text-secondary-900 dark:text-secondary-50 truncate">{title}</h2>
        {subtitle && <p className="text-xs text-secondary-500 dark:text-secondary-400 truncate hidden sm:block">{subtitle}</p>}
      </div>

      {/* Live indicators */}
      <div className="hidden md:flex items-center gap-4 mr-2">
        <div className="flex items-center gap-1.5 text-xs">
          <Activity className="w-3.5 h-3.5 text-accent-500" />
          <span className="text-secondary-500 dark:text-secondary-400">Rounds</span>
          <span className="font-semibold text-secondary-900 dark:text-secondary-100 tabular-nums">{rounds.length}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Leaf className="w-3.5 h-3.5 text-primary-500" />
          <span className="text-secondary-500 dark:text-secondary-400">Green</span>
          <span className="font-semibold text-secondary-900 dark:text-secondary-100 tabular-nums">{greenEnergyPct}%</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Cpu className="w-3.5 h-3.5 text-warning-500" />
          <span className="text-secondary-500 dark:text-secondary-400">Carbon</span>
          <span className="font-semibold text-secondary-900 dark:text-secondary-100 tabular-nums">{totalCarbon.toFixed(2)}kg</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1.5">
        {isTraining ? (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
            Training...
          </span>
        ) : (
          <button
            className="btn-primary text-xs px-3 py-1.5"
            onClick={() => startTrainingRound()}
          >
            <Play className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Start Round</span>
          </button>
        )}
        <button
          className="btn-ghost text-xs px-2 py-1.5"
          onClick={() => resetFederation()}
          title="Reset federation state"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          className="btn-ghost px-2 py-1.5"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title="Toggle dark/light mode"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
