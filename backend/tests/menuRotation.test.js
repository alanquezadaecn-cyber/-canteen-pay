import { describe, it, expect } from 'vitest';
import { computeCurrentWeek } from '../src/routes/products.js';

describe('computeCurrentWeek', () => {
  it('modo MANUAL: usa la semana fijada por el admin, sin importar la fecha', () => {
    expect(computeCurrentWeek(null, 'MANUAL', 5)).toBe(5);
    expect(computeCurrentWeek('2020-01-01', 'MANUAL', 3)).toBe(3);
  });

  it('modo MANUAL: acota entre 1 y 8', () => {
    expect(computeCurrentWeek(null, 'MANUAL', 0)).toBe(1);
    expect(computeCurrentWeek(null, 'MANUAL', 99)).toBe(8);
    expect(computeCurrentWeek(null, 'MANUAL', null)).toBe(1);
  });

  it('modo AUTO sin fecha de inicio: semana 1 por defecto', () => {
    expect(computeCurrentWeek(null, 'AUTO', null)).toBe(1);
  });

  it('modo AUTO: la semana avanza cada 7 días desde el inicio', () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    expect(computeCurrentWeek(start, 'AUTO', null)).toBe(1);

    const in7Days = new Date(start); in7Days.setDate(in7Days.getDate() + 7);
    // Comparamos contra "hoy" simulando el inicio 7 días atrás
    const startedAWeekAgo = new Date(); startedAWeekAgo.setDate(startedAWeekAgo.getDate() - 7);
    expect(computeCurrentWeek(startedAWeekAgo, 'AUTO', null)).toBe(2);

    const startedTwoWeeksAgo = new Date(); startedTwoWeeksAgo.setDate(startedTwoWeeksAgo.getDate() - 14);
    expect(computeCurrentWeek(startedTwoWeeksAgo, 'AUTO', null)).toBe(3);
  });

  it('modo AUTO: el ciclo se repite cada 8 semanas (vuelve a la semana 1)', () => {
    const startedEightWeeksAgo = new Date(); startedEightWeeksAgo.setDate(startedEightWeeksAgo.getDate() - 56);
    expect(computeCurrentWeek(startedEightWeeksAgo, 'AUTO', null)).toBe(1);

    const startedNineWeeksAgo = new Date(); startedNineWeeksAgo.setDate(startedNineWeeksAgo.getDate() - 63);
    expect(computeCurrentWeek(startedNineWeeksAgo, 'AUTO', null)).toBe(2);
  });

  it('modo AUTO: fecha de inicio en el futuro cae en semana 1', () => {
    const future = new Date(); future.setDate(future.getDate() + 10);
    expect(computeCurrentWeek(future, 'AUTO', null)).toBe(1);
  });
});
