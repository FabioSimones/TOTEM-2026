interface ErrorMessageProps {
  message: string | null;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) {
    return null;
  }
  return (
    <p className="ui-error-message" role="alert">
      {message}
    </p>
  );
}
