interface ModuleHeaderProps {
  title: string;
  description?: string;
}

export function ModuleHeader({ title, description }: ModuleHeaderProps) {
  return (
    <header className="module-header">
      <h1>{title}</h1>
      {description && <p className="module-header__description">{description}</p>}
    </header>
  );
}
