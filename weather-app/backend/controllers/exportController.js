const WeatherQuery = require('../models/WeatherQuery');
const PDFDocument  = require('pdfkit');
const xml2js       = require('xml2js');

/**
 * GET /api/export?format=json|csv|xml|pdf|markdown&city=...&from=...&to=...
 * Exports stored weather queries in requested format
 */
exports.exportData = async (req, res, next) => {
  try {
    const { format = 'json', city, from, to, limit = 100 } = req.query;

    // Build filter
    const filter = {};
    if (city) filter['resolvedLocation.city'] = { $regex: city, $options: 'i' };
    if (from) filter.startDate = { $gte: new Date(from) };
    if (to)   filter.endDate   = { $lte: new Date(to) };

    const records = await WeatherQuery.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    if (records.length === 0) {
      return res.status(404).json({ error: 'No records found matching the given filters.' });
    }

    switch (format.toLowerCase()) {
      case 'json':
        return exportJSON(res, records);
      case 'csv':
        return exportCSV(res, records);
      case 'xml':
        return exportXML(res, records);
      case 'pdf':
        return exportPDF(res, records);
      case 'markdown':
      case 'md':
        return exportMarkdown(res, records);
      default:
        return res.status(400).json({ error: `Unsupported format "${format}". Use: json, csv, xml, pdf, markdown` });
    }
  } catch (err) { next(err); }
};

// ── JSON ──────────────────────────────────────────────────────────────
function exportJSON(res, records) {
  res.setHeader('Content-Disposition', 'attachment; filename="weather_export.json"');
  res.setHeader('Content-Type', 'application/json');
  res.json({
    exported_at: new Date().toISOString(),
    author: 'Muhammad Hamza',
    source: 'WeatherSphere - PM Accelerator Assessment',
    count: records.length,
    records,
  });
}

// ── CSV ───────────────────────────────────────────────────────────────
function exportCSV(res, records) {
  const headers = [
    'ID','Location','City','Country','Lat','Lon',
    'StartDate','EndDate','Unit',
    'CurrentTemp','MinTemp','MaxTemp','FeelsLike',
    'Humidity','Pressure','WindSpeed','Description',
    'Notes','Tags','IsFavorite','CreatedAt'
  ];

  const escape = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows = records.map(r => [
    r._id, r.location,
    r.resolvedLocation?.city, r.resolvedLocation?.country,
    r.resolvedLocation?.lat, r.resolvedLocation?.lon,
    r.startDate, r.endDate, r.unit,
    r.weatherData?.currentTemp, r.weatherData?.minTemp, r.weatherData?.maxTemp, r.weatherData?.feelsLike,
    r.weatherData?.humidity, r.weatherData?.pressure, r.weatherData?.windSpeed, r.weatherData?.description,
    r.notes, (r.tags || []).join(';'), r.isFavorite, r.createdAt
  ].map(escape).join(','));

  const csv = [headers.join(','), ...rows].join('\r\n');
  res.setHeader('Content-Disposition', 'attachment; filename="weather_export.csv"');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.send('\uFEFF' + csv); // BOM for Excel compatibility
}

// ── XML ───────────────────────────────────────────────────────────────
async function exportXML(res, records) {
  const builder = new xml2js.Builder({
    rootName: 'WeatherExport',
    xmldec: { version: '1.0', encoding: 'UTF-8' }
  });

  const data = {
    metadata: {
      exported_at: new Date().toISOString(),
      author: 'Muhammad Hamza',
      count: records.length
    },
    records: records.map(r => ({
      record: {
        $: { id: String(r._id) },
        location:         r.location,
        city:             r.resolvedLocation?.city || '',
        country:          r.resolvedLocation?.country || '',
        coordinates:      { lat: r.resolvedLocation?.lat, lon: r.resolvedLocation?.lon },
        dateRange:        { start: r.startDate, end: r.endDate },
        unit:             r.unit,
        weather: {
          temperature:    r.weatherData?.currentTemp,
          min:            r.weatherData?.minTemp,
          max:            r.weatherData?.maxTemp,
          feelsLike:      r.weatherData?.feelsLike,
          humidity:       r.weatherData?.humidity,
          pressure:       r.weatherData?.pressure,
          windSpeed:      r.weatherData?.windSpeed,
          description:    r.weatherData?.description,
        },
        notes:       r.notes || '',
        tags:        (r.tags || []).join(', '),
        isFavorite:  r.isFavorite,
        createdAt:   r.createdAt,
      }
    }))
  };

  const xml = builder.buildObject(data);
  res.setHeader('Content-Disposition', 'attachment; filename="weather_export.xml"');
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.send(xml);
}

// ── PDF ───────────────────────────────────────────────────────────────
function exportPDF(res, records) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  res.setHeader('Content-Disposition', 'attachment; filename="weather_export.pdf"');
  res.setHeader('Content-Type', 'application/pdf');
  doc.pipe(res);

  // Title Page
  doc.fontSize(24).font('Helvetica-Bold').text('WeatherSphere Export', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(12).font('Helvetica').fillColor('#555')
    .text('PM Accelerator Technical Assessment', { align: 'center' });
  doc.text(`Author: Muhammad Hamza`, { align: 'center' });
  doc.text(`Exported: ${new Date().toLocaleString()}`, { align: 'center' });
  doc.text(`Records: ${records.length}`, { align: 'center' });
  doc.moveDown(2);

  records.forEach((r, i) => {
    if (i > 0) doc.addPage();
    const unit = r.unit === 'metric' ? '°C' : '°F';

    doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e3a5f')
      .text(`${i + 1}. ${r.resolvedLocation?.city || r.location}, ${r.resolvedLocation?.country || ''}`);
    doc.moveDown(0.3);

    const tableData = [
      ['Location Query',  r.location],
      ['Date Range',      `${new Date(r.startDate).toDateString()} → ${new Date(r.endDate).toDateString()}`],
      ['Coordinates',     `${r.resolvedLocation?.lat?.toFixed(4)}, ${r.resolvedLocation?.lon?.toFixed(4)}`],
      ['Current Temp',    r.weatherData?.currentTemp != null ? `${r.weatherData.currentTemp}${unit}` : 'N/A'],
      ['Min / Max Temp',  `${r.weatherData?.minTemp ?? 'N/A'}${unit} / ${r.weatherData?.maxTemp ?? 'N/A'}${unit}`],
      ['Feels Like',      r.weatherData?.feelsLike != null ? `${r.weatherData.feelsLike}${unit}` : 'N/A'],
      ['Humidity',        `${r.weatherData?.humidity ?? 'N/A'}%`],
      ['Pressure',        `${r.weatherData?.pressure ?? 'N/A'} hPa`],
      ['Wind Speed',      `${r.weatherData?.windSpeed ?? 'N/A'} m/s`],
      ['Description',     r.weatherData?.description || 'N/A'],
      ['Notes',           r.notes || 'None'],
      ['Tags',            (r.tags || []).join(', ') || 'None'],
      ['Favorite',        r.isFavorite ? 'Yes' : 'No'],
      ['Stored At',       new Date(r.createdAt).toLocaleString()],
    ];

    tableData.forEach(([key, val]) => {
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#333').text(`${key}: `, { continued: true });
      doc.font('Helvetica').fillColor('#000').text(String(val));
    });
  });

  doc.end();
}

// ── Markdown ──────────────────────────────────────────────────────────
function exportMarkdown(res, records) {
  const lines = [
    `# WeatherSphere Export`,
    ``,
    `> **Author:** Muhammad Hamza | **PM Accelerator Technical Assessment**  `,
    `> **Exported:** ${new Date().toLocaleString()}  `,
    `> **Total Records:** ${records.length}`,
    ``,
    `---`,
    ``,
  ];

  records.forEach((r, i) => {
    const unit = r.unit === 'metric' ? '°C' : '°F';
    lines.push(`## ${i + 1}. ${r.resolvedLocation?.city || r.location}, ${r.resolvedLocation?.country || ''}`);
    lines.push(``);
    lines.push(`| Field | Value |`);
    lines.push(`|-------|-------|`);
    lines.push(`| Location Query | ${r.location} |`);
    lines.push(`| Coordinates | ${r.resolvedLocation?.lat?.toFixed(4)}, ${r.resolvedLocation?.lon?.toFixed(4)} |`);
    lines.push(`| Date Range | ${new Date(r.startDate).toDateString()} → ${new Date(r.endDate).toDateString()} |`);
    lines.push(`| Current Temp | ${r.weatherData?.currentTemp ?? 'N/A'}${unit} |`);
    lines.push(`| Min / Max | ${r.weatherData?.minTemp ?? 'N/A'}${unit} / ${r.weatherData?.maxTemp ?? 'N/A'}${unit} |`);
    lines.push(`| Feels Like | ${r.weatherData?.feelsLike ?? 'N/A'}${unit} |`);
    lines.push(`| Humidity | ${r.weatherData?.humidity ?? 'N/A'}% |`);
    lines.push(`| Pressure | ${r.weatherData?.pressure ?? 'N/A'} hPa |`);
    lines.push(`| Wind Speed | ${r.weatherData?.windSpeed ?? 'N/A'} m/s |`);
    lines.push(`| Description | ${r.weatherData?.description || 'N/A'} |`);
    lines.push(`| Notes | ${r.notes || 'None'} |`);
    lines.push(`| Tags | ${(r.tags || []).join(', ') || 'None'} |`);
    lines.push(`| Favorite | ${r.isFavorite ? '⭐ Yes' : 'No'} |`);
    lines.push(`| Stored At | ${new Date(r.createdAt).toLocaleString()} |`);
    lines.push(``);

    if (r.mapData?.mapUrl) {
      lines.push(`📍 [View on Map](${r.mapData.mapUrl})`);
      lines.push(``);
    }
    if (r.youtubeVideos?.length) {
      lines.push(`📺 **Related Videos:**`);
      r.youtubeVideos.slice(0, 2).forEach(v => {
        lines.push(`- [${v.title}](${v.url})`);
      });
      lines.push(``);
    }
    lines.push(`---`);
    lines.push(``);
  });

  res.setHeader('Content-Disposition', 'attachment; filename="weather_export.md"');
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.send(lines.join('\n'));
}
