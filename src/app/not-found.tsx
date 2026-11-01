import Link from "next/link";
import Mark from "@/components/Mark";

const NotFound = () => (
  <main className="notice">
    <Mark size={32} />
    <h1>No such maze</h1>
    <p>That maze ID is not valid. Check it for typos, or start from the menu.</p>
    <Link href="/" className="button button-primary">
      Back to menu
    </Link>
  </main>
);

export default NotFound;