import { useGameStore } from './store/useGameStore';
import { HomeScreen } from './components/HomeScreen';
import { QuizScreen } from './components/QuizScreen';
import { FeedbackScreen } from './components/FeedbackScreen';
import { ResultScreen } from './components/ResultScreen';
import { LeaderboardScreen } from './components/LeaderboardScreen';
import { ReviewScreen } from './components/ReviewScreen';

function renderScreen(screen: string) {
  switch (screen) {
    case 'quiz':
      return <QuizScreen />;
    case 'feedback':
      return <FeedbackScreen />;
    case 'result':
      return <ResultScreen />;
    case 'leaderboard':
      return <LeaderboardScreen />;
    case 'review':
      return <ReviewScreen />;
    case 'home':
    default:
      return <HomeScreen />;
  }
}

function App() {
  const screen = useGameStore((s) => s.screen);

  return (
    <div key={screen} className="animate-fade-in">
      {renderScreen(screen)}
    </div>
  );
}

export default App;
