export default function ToastNotification({ toast }) {
  if (!toast.show) return null;

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return "fas fa-check-circle";
      case "error":
        return "fas fa-exclamation-circle";
      case "warning":
        return "fas fa-exclamation-triangle";
      default:
        return "fas fa-info-circle";
    }
  };

  const getBgColor = () => {
    switch (toast.type) {
      case "success":
        return "bg-green-500 dark:bg-green-600";
      case "error":
        return "bg-red-500 dark:bg-red-600";
      case "warning":
        return "bg-yellow-500 dark:bg-yellow-600";
      default:
        return "bg-orange-500 dark:bg-orange-500";
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50">
      <div
        className={`${getBgColor()} text-white px-6 py-4 rounded-lg shadow-lg neumorphic-light dark:neumorphic-dark flex items-center space-x-3 min-w-80 max-w-md`}
      >
        <i className={`${getIcon()} text-lg`}></i>
        <span className="flex-1">{toast.message}</span>
      </div>
    </div>
  );
}
