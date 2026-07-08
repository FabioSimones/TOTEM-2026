import { ThemeToggle } from "../ui/ThemeToggle";

interface ModuleHeaderProps {
  title: string;
  description?: string;
}

export function ModuleHeader({ title, description }: ModuleHeaderProps) {
  return (
    <header className="module-header">
      <div className="module-header__titles">
        <h1>{title}</h1>
        {description && <p className="module-header__description">{description}</p>}
      </div>
      <ThemeToggle />
    </header>
  );
}
