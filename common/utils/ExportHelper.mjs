import xlsx from 'xlsx';

export const exportToExcel = (data, sheetName = 'Sheet1') => {
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(wb, ws, sheetName);
    return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

export const exportToJson = (data) => {
    return JSON.stringify(data, null, 2);
};

export const exportToXml = (data, rootName = 'root', itemName = 'item') => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n`;

    data.forEach(item => {
        xml += `  <${itemName}>\n`;
        for (const [key, value] of Object.entries(item)) {
            const safeKey = String(key).replace(/:/g, '').replace(/\s/g, '_').replace(/\./g, '').replace(/\//g, '').replace(/\(/g, '').replace(/\)/g, '').replace(/\,/g, '').replace(/\=/g, '')
                .replace(/á/g, 'a')
                .replace(/é/g, 'e')
                .replace(/í/g, 'i')
                .replace(/ó/g, 'o')
                .replace(/ú/g, 'u')
                .replace(/Á/g, 'A')
                .replace(/É/g, 'E')
                .replace(/Í/g, 'I')
                .replace(/Ó/g, 'O')
                .replace(/Ú/g, 'U');
            // Simple escaping
            const safeValue = value === null || value === undefined ? '' :
                String(value).replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&apos;');

            xml += `    <${safeKey}>${safeValue}</${safeKey}>\n`;
        }
        xml += `  </${itemName}>\n`;
    });

    xml += `</${rootName}>`;
    return xml;
};

export const handleExport = (res, data, format, filename, itemName = 'item') => {
    try {
        switch (format) {
            case 'xlsx':
            case 'excel':
                const buffer = exportToExcel(data, filename);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);
                res.send(buffer);
                break;
            case 'xml':
                const xml = exportToXml(data, filename, itemName); // simple root/item names
                res.setHeader('Content-Type', 'application/xml');
                res.setHeader('Content-Disposition', `attachment; filename=${filename}.xml`);
                res.send(xml);
                break;
            case 'json':
            default:
                const json = exportToJson(data);
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', `attachment; filename=${filename}.json`);
                res.send(json);
                break;
        }
    } catch (error) {
        console.error('Export Error:', error);
        res.status(500).json({ success: false, error: 'Error generating export file' });
    }
};
