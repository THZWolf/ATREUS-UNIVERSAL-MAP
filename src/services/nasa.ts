import { Star } from '../types';

// Using NASA's Exoplanet Archive API (TAP service)
// This is a public API that doesn't require a key for basic queries
const NASA_TAP_URL = 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync';

export async function fetchStellarData(keywords?: string[]): Promise<Star[]> {
  try {
    // Expand query to include more metadata for richer filtering
    const baseQuery = "SELECT TOP 250 hostname, ra, dec, sy_dist, sy_vmag, st_teff, st_rad, st_mass FROM pscomppars WHERE sy_dist IS NOT NULL";
    let filter = "";
    
    if (keywords && keywords.length > 0) {
      const conditions = keywords.map(k => `hostname LIKE '%${k}%'`).join(' OR ');
      filter = ` AND (${conditions})`;
    }
    
    const query = `${baseQuery}${filter} ORDER BY sy_dist ASC`;
    const response = await fetch(`/api/nasa/stellar?query=${encodeURIComponent(query)}&format=json`);
    
    if (!response.ok) throw new Error(`NASA API Error: ${response.status}`);
    
    const data = await response.json();
    
    return data.map((item: any, index: number) => ({
      id: `star-${index}`,
      name: item.hostname,
      ra: item.ra,
      dec: item.dec,
      dist: item.sy_dist,
      mag: item.sy_vmag,
      type: item.st_teff > 6000 ? 'Hot Giant' : item.st_teff < 3500 ? 'M-Dwarf' : 'G-Type Main',
      isSimulated: false,
      metadata: {
        temp: item.st_teff,
        radius: item.st_rad,
        mass: item.st_mass
      }
    }));
  } catch (error) {
    console.warn('NASA API unreachable. Activating Quantum Simulation Fallback.', error);
    return Array.from({ length: 150 }).map((_, i) => ({
      id: `sim-${i}`,
      name: `SYNTH-${1000 + i}`,
      ra: Math.random() * 360,
      dec: Math.random() * 180 - 90,
      dist: 10 + Math.random() * 1000,
      mag: 2 + Math.random() * 12,
      type: i % 3 === 0 ? 'Pulsar' : i % 3 === 1 ? 'Black Hole' : 'Binary System',
      isSimulated: true
    }));
  }
}

export async function fetchNEOData(): Promise<any[]> {
  try {
    const response = await fetch('/api/nasa/neo');
    if (!response.ok) throw new Error('NASA NEO API Error');
    const data = await response.json();
    return Object.values(data.near_earth_objects).flat();
  } catch (error) {
    console.error('Error fetching NEO data:', error);
    return [];
  }
}
