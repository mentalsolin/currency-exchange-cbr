import fetch from 'node-fetch';
import { XMLParser } from 'fast-xml-parser';
import express from 'express';
import cors from 'cors';

const app = express();
const port = 3001;

app.use(cors());

const api = 'https://www.cbr.ru/scripts/XML_daily.asp?date_req=';

async function getCurrentRate(fromCurrency, toCurrency, day, month, year) {
    try {
        const response = await fetch(api + day + "/" + month + "/" + year);
        const data = await response.text();

        const parser = new XMLParser();
        const jsonObj = parser.parse(data);

        const valutes = jsonObj.ValCurs.Valute;

        if (toCurrency === 'RUB') {
            for (const valute of valutes) {
                if (fromCurrency === valute.CharCode) {
                    return parseFloat(valute.Value.replace(',', '.')).toFixed(2);
                }
            }
        } else {
            let a = null;
            let b = null;

            for (const valute of valutes) {
                if (fromCurrency === valute.CharCode) {
                    a = parseFloat(valute.Value.replace(',', '.'));
                }
                if (toCurrency === valute.CharCode) {
                    b = parseFloat(valute.Value.replace(',', '.'));
                }
            }

            if (a !== null && b !== null) {
                return (a / b).toFixed(2);
            }
        }

        return "Currency not found.";
    } catch (error) {
        console.error('Error fetching or parsing XML:', error.message);
        throw error;
    }
}

app.get('/:fromCurrency-:toCurrency-:day-:month-:year', async (req, res) => {
    const { fromCurrency, toCurrency, day, month, year } = req.params;

    try {
        const rateData = await getCurrentRate(fromCurrency, toCurrency, day, month, year);
        res.status(200).json(rateData);
    } catch (error) {
        res.status(500).send('Error fetching currency rate.');
    }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
