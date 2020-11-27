export const getCurrentTime = () => Math.floor(new Date().getTime() / 1000);
export const toSeconds = (str: string|number|Date) => Math.floor(new Date(str).getTime() / 1000);
export const secondUnit = 1;
export const minuteUnit = 60 * secondUnit;
export const hourUnit = 60 * minuteUnit;
export const dayUnit = 24 * hourUnit;

const intpad = (i: number) => i.toFixed(0).padStart(2, '0');

export const sec2time = (sec: number) => {
  if (sec < 0) return '00:00:00';

  const s = sec % 60;
  const tm = Math.floor(sec / 60);
  const h = Math.floor(tm / 60);
  const m = tm % 60;

  return `${intpad(h)}:${intpad(m)}:${intpad(s)}`;
};

export const datetime2format = (date: string | number | Date) => {
  try {
    const d = new Date(date);
    const year = intpad(d.getFullYear());
    const month = intpad(d.getMonth() + 1);
    const day = intpad(d.getDate());
    const hour = intpad(d.getHours());
    const minute = intpad(d.getMinutes());

    return `${month}-${day}-${year} / ${hour}:${minute}`;
  } catch (e) {
    return '';
  }
};

export const date2format = (date: string | number | Date) => {
  try {
    const d = new Date(date);
    const year = intpad(d.getFullYear());
    const month = intpad(d.getMonth() + 1);
    const day = intpad(d.getDate());

    return `${month}-${day}-${year}`;
  } catch (e) {
    return '';
  }
};

export const datetime2utc = (date: string | number | Date) => new Date(date).toUTCString().replace('GMT', 'UTC');

export const sec2minsec = (sec: number) => {
  try {
    const s = sec % 60;
    const m = Math.floor(sec / 60);

    return `${intpad(m)}:${intpad(s)}`;
  } catch (e) {
    return '0:00';
  }
};

export const dateDiff = (d1: Date, d2: Date) => Math.floor(
  (d1.getTime() - d2.getTime()) / 1000 / 60 / 60 / 24,
) + 1;
