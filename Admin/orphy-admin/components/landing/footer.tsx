import Link from "next/link";

export default function Footer() {
  return (
    <footer className="flex flex-col justify-center items-center gap-4 py-8 px-4 border-t border-border">
      <div className="flex flex-row justify-between">
        <ul className="flex flex-row gap-4 text-sm">
          <li className="text-muted-foreground hover:text-foreground cursor-pointer">
            <Link href="/sign-in">Se connecter</Link>
          </li>
          <li className="text-muted-foreground">•</li>
          <li className="text-muted-foreground hover:text-foreground">
            <Link href="mailto:contact@orphy.app">Contact</Link>
          </li>
        </ul>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()}{" "}
          <span className="font-semibold text-foreground">Orphy</span>
          {" "}- Feedback pour agences digitales
        </p>
      </div>
    </footer>
  );
}
