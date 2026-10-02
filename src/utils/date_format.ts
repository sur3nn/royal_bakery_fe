export const formatDate = (date?: string | Date | null): string => {
  if (!date) return '-';

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return '-';
  }

  return parsedDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatTime = (time?: string | null): string => {
  if (!time) return '-';

  // Handles "18:30:00" / "18:30"
  const parsedTime = new Date(`1970-01-01T${time}`);

  if (Number.isNaN(parsedTime.getTime())) {
    return '-';
  }

  return parsedTime.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatDateTime = (
  dateTime?: string | Date | null
): string => {
  if (!dateTime) return '-';

  const date = new Date(dateTime);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};