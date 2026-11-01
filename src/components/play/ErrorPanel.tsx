import Link from "next/link";

type ErrorPanelProps = {
  message: string;
  onRetry: () => void;
};

const ErrorPanel = ({ message, onRetry }: ErrorPanelProps) => (
  <section className="panel" aria-label="Run problem">
    <p className="label tone-danger">Run not accepted</p>
    <p>{message}</p>
    <div className="panel-actions">
      <button type="button" className="button button-primary" onClick={onRetry} autoFocus>
        Try again
      </button>
      <Link href="/" className="button">
        Menu
      </Link>
    </div>
  </section>
);

export default ErrorPanel;