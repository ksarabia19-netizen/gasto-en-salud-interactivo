const desglose1 = "json/1erDesglose.json";
const desgloseCompact = "json/compacto.json";
const publico = "json/gastoPublico.json";

const callDatos = async (url) => {
    const response = await fetch(url);
    const data = await response.json();
    return data;
};

const getColNames = (data, colFecha) => {
    const varNames = Object.keys(data[0]).slice(colFecha);
    const varFecha = Object.keys(data[0])[colFecha - 1];
    return {
        varNames: varNames,
        Fecha: varFecha
    };
}

class TimseSeries {
    constructor(data, space) {
        this.data = data
        this.space = space;
        this.init();
    }
    init() {
        this.colNames = getColNames(this.data, 3)
        this.botones = [];
    }
    nameChecker(names) {
        const validNames = [];
        names.map(name => {
            if (this.colNames.varNames.includes(name)) validNames.push(name)
            else console.log(`This ${name} is not listed`)
        })
        return validNames;
    }
    columStackTrace(newNames) {
        newNames.reverse()
        const meses = this.colNames.varNames;
        const anios = [];
        const dlen = this.data.length;
        const range = [+this.data[0][this.colNames.Fecha], +
            this.data[dlen - 1][this.colNames.Fecha]]
        for (let index = range[0]; index <= range[1]; index++) anios.push(index);
        const getMes = (col) => {
            const serie = [];
            let top = dlen;
            for (let index = 0; index < top; index += 1) {
                serie.push(this.data[index][col]);
            }

            return serie;
        }

        const apilado = meses.map(mes => ({
            x: anios,
            y: getMes(mes),
            name: newNames[meses.indexOf(mes)],
            type: 'bar',
        }));
        console.log(apilado)
        return (apilado);
    }
    /**
     * @param {{args: string}} args 
     * @param {[string]} labels
     */
    boton(labels, args, method = "relayout") {
        const gBtn = labels.map((lbl, i) => (
            {
                label: lbl,
                method: method,
                args: [args[i]]
            }
        ));

        this.botones.push(gBtn)
        return gBtn;
    }
    setControl() {
        const graf = document.getElementById(this.space);
        const btns = this.botones.flatMap(btn => btn.flatMap(btn => btn.args));

        const opciones = Object.values(btns.reduce((acc, obj) => {
            const [key, value] = Object.entries(obj)[0];
            if (!acc[key]) acc[key] = [];
            acc[key].push(value)
            return acc
        }, {}))

        const ctrlOpc = new Set(btns.flatMap(btn => Object.keys(btn)[0]));

        graf.on("plotly_relayout", (eventdata) => {
            const optSlct = [];
            let iSet = 0;
            ctrlOpc.forEach(opc => {
                optSlct.push(graf.layout[opc] || opciones[iSet][0])
                iSet++;
            })
            let chooSerie = 0;
            let vuelta = 1;
            opciones.map((opt, i) => {
                vuelta = vuelta * (i + 1)
                for (let j = 0; j < opt.length; j++) {
                    if (optSlct[i] === opt[j]) { chooSerie += (j * vuelta); break; }
                }
            })
            Plotly.react(graf, this.series[chooSerie], { ...graf.layout, ...this.serieOptions[chooSerie] })
        })
    }
}


async function init() {
    const graf0 = new TimseSeries(await callDatos(desglose1), "graf-0");
    const graf1 = new TimseSeries(await callDatos(desgloseCompact), "graf-1");
    const graf2 = new TimseSeries(await callDatos(publico), "graf-2");

    graf0.series = [
        graf0.columStackTrace([
            "Resto del mundo",
            "Privado: otros fondos",
            "Privado: Primas",
            "Privado: Inst. sin fines de lucro",
            "Privado: del bolsillo",
            "Público: personas con SS",
            "Público: personas sin SS"
        ])
    ]
    Plotly.newPlot("graf-0", graf0.series[0], {
        barmode: 'stack',
        yaxis: {
            title: {
                text: "Millones de pesos de 2024"
            },
            rangemode: 'tozero'
        },
        title: {
            text: "Gasto público, privado y el resto"
        },
        xaxis: {
            tickmode: 'linear',
            tick0: 0,   
            dtick: 1,
            tickangle: -45    
        }
    },
        {
            responsive: true
        });

    graf1.series = [
        graf1.columStackTrace([
            "Resto del mundo",
            "Privado",
            "Público"
        ])
    ]
    Plotly.newPlot("graf-1", graf1.series[0], {
        barmode: 'stack',
        yaxis: {
            title: {
                text: "Millones de pesos de 2024"
            },
            rangemode: 'tozero'
        },
        title: {
            text: "Gasto 3 principales conceptos"
        },
        xaxis: {
            tickmode: 'linear',
            tick0: 0,   
            dtick: 1,
            tickangle: -45    
        }
    },
        {
            responsive: true
        });

    graf2.series = [
        graf2.columStackTrace([
            "ISSFAM",
            "ISSES",
            "PEMEX",
            "ISSSTE",
            "IMSS",
            "Gasto estatal",
            "Gasto federal"
        ])
    ]
    Plotly.newPlot("graf-2", graf2.series[0], {
        barmode: 'stack',
        yaxis: {
            title: {
                text: "Millones de pesos de 2024"
            },
            rangemode: 'tozero'
        },
        title: {
            text: "Gasto público desglosado"
        },
        xaxis: {
            tickmode: 'linear',
            tick0: 0,   
            dtick: 1,
            tickangle: -45    
        }
    }, {
        responsive: true
    });
}
init()



