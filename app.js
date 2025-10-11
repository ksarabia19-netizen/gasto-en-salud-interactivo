const preciosUrl = "Precio_tendencia.json";
const recaudacionUrl = "Recaudacion.json";


const callDatos = async (url) =>{
  const response = await fetch(url);
  const data = await response.json();
  return data;
};

const getColNames = (data, colFecha) => {
  const varNames = Object.keys(data[0]).slice(colFecha);
  const varFecha = Object.keys(data[0])[colFecha-1];
  return{
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
    init(){
        this.colNames = getColNames(this.data, 1)
        this.botones = [];
    }
    graficar(){

    }
    lineTrace(cols, ver = true){
        const x = this.data.map(d => d[this.colNames.Fecha]);
        cols = this.nameChecker(cols);
        const ys = cols.map(col => ({
            x: x,
            y: this.data.map(d => +d[col]), 
            name: col,
            type: 'scatter',
            mode: 'lines',
            line: { width: 1},
            visible: ver
        }));
        return ys;
    }
    nameChecker(names){
        const validNames = [];
        names.map(name =>{
            if(this.colNames.varNames.includes(name)) validNames.push(name)
                else console.log(`This ${name} is not listed`)
        })
        return validNames;
    }
    columStackTrace(col){
        const meses = ["enero","febrero","marzo","abril","mayo","junio","julio",
            "agosto","septiembre","octubre","noviembre", "diciembre"];
        const anios = [];
        const dlen = this.data.length;
        const range = [+this.data[0][this.colNames.Fecha].slice(0,4), + 
                        this.data[dlen-1][this.colNames.Fecha].slice(0,4)]
        for (let index = range[0]; index <=range[1]; index++) anios.push(index);
        const getMes = (start)=>{
            const serie = [];
            let top = dlen;
            for(let index = start; index < top; index +=12) 
                serie.push(this.data[index][col]); 
            return serie;
        }
        const apilado = meses.map(mes =>({
            x: anios,
            y: getMes(meses.indexOf(mes)),
            name: mes,
            type: 'bar',
        }));
        return(apilado);
    }
    lineSumTrace(col, ver = true){
        const dlen = this.data.length;
        
        const range = [+this.data[0][this.colNames.Fecha].slice(0,4), + 
                        this.data[dlen-1][this.colNames.Fecha].slice(0,4)]
        const anios = [];                
        for (let index = range[0]; index <=range[1]; index++) anios.push(index);
        const getSuma = (cl) => {
            const suma = []
            let i = 0;
            for (let index = 0; index < anios.length; index++) {
                let tmpSum = 0;
                for(let mes = 1; mes <=12; mes++){
                    tmpSum += this.data[i][cl];
                    i++
                }
                suma[index] = tmpSum;
            }
            return suma;
        }
        const sumado = col.map(cl =>({
            x: anios,
            y: getSuma(cl),
            type: 'scater',
            mode: 'lines',
            name: cl,
            line: { width: 1.75},
            visible: ver
        }))
        return sumado;
    }
    /**
     * @param {{args: string}} args 
     * @param {[string]} labels
     */
    boton(labels, args, method = "relayout"){
        const gBtn = labels.map((lbl, i)=>(
            {
                label: lbl,
                method: method,
                args: [args[i]]
            }
        ));

        this.botones.push(gBtn)
        return gBtn;
    }
    setControl(){
        const graf = document.getElementById(this.space);
        const  btns = this.botones.flatMap(btn => btn.flatMap(btn => btn.args));

        const opciones = Object.values( btns.reduce((acc, obj)=>{
            const[key, value] = Object.entries(obj)[0];
            if(!acc[key]) acc[key] = [];
            acc[key].push(value)
            return acc
        }, {}))

        const ctrlOpc = new Set(btns.flatMap(btn => Object.keys(btn)[0]));

        graf.on("plotly_relayout", (eventdata)=>{
            const optSlct = [];
            let iSet = 0;
            ctrlOpc.forEach(opc=>{
                optSlct.push( graf.layout[opc] || opciones[iSet][0])
                iSet++;
            })
            let chooSerie=0;
            let vuelta = 1;
            opciones.map((opt,i) => { 
                vuelta = vuelta * (i+1)
                for(let j=0; j<opt.length; j++){
                    if(optSlct[i] === opt[j]) { chooSerie+= (j*vuelta); break;}
                }
            })
            Plotly.react(graf, this.series[chooSerie], {...graf.layout, ...this.serieOptions[chooSerie]})
        })
    }
}


async function init(){
    const graf1 = new TimseSeries(await callDatos(preciosUrl),"graf-0");
    const graf2 = new TimseSeries(await callDatos("Recaudacion.json"),"graf-1");
    //console.log(graf1)
    
    graf1.series = [
        graf1.lineTrace(["Cerveza_real","Cerveza_nominal"]),
        graf1.lineTrace(["Brandy_real", "Vino_real","Tequila_real","Ron_real", "Otros licores_real"])
    ]
    graf1.serieOptions=[
        {},{legend: {"orientation":"h"}}
    ]
    Plotly.newPlot("graf-0", graf1.series[0], {
        yaxis: { 
            title: {
                text: "índice"
            }, 
            rangemode: 'tozero'
        },
        updatemenus:[
            {
            buttons: graf1.boton(["cerveza","otros alcoholes"],
                [{Bebida:"cerveza"},{Bebida:"otros_alcoholes"}]),
            x: 0.25,
            y: 1.15,
            direction: "left"
            }
        ] 
    });
    graf1.setControl();

    graf2.series = [
        graf2.lineSumTrace(['alcohol','alcohol_real']),
        graf2.lineSumTrace(['cerveza_bebidas','cerveza_bebidas_real']),
        graf2.columStackTrace(['alcohol_real']),
        graf2.columStackTrace(['cerveza_bebidas_real'])
    ]
    graf2.serieOptions = [
        {barmode: null},{barmode: null},{barmode: 'stack'},{barmode: 'stack'}
    ]
    const layout = {
        updatemenus:[
            {
            buttons: graf2.boton(["alcohol","cerveza_bebidas"],[{"activeP":"alcohol"},{"activeP":"cerveza_bebidas"}]),
            x: 0.25,
            y: 1.15,
            direction: "left"
            },
            {
            buttons: graf2.boton(["linea","barra"],[{"aggr": "linea"},{"aggr":"barra"}]),
            x: 0.55,
            y: 1.15,
            direction: "left"
            }
        ] 
    }

    Plotly.newPlot("graf-1", graf2.series[0], layout);
    graf2.setControl();

}
init()


/*
    function graficarOpciones(trace1, trace2){
        const traces = [
            ...trace1,
            ...trace2
        ]
        const layout = {
            title: {
                text: 'titulo'
            },
            xaxis: { 
                type: 'date',
                showgrid: false
            },
            yaxis: { 
                title: {
                    text: 'yname'
                }, 
                rangemode: 'tozero'
            },
            updatemenus:[
                {
                    buttons:[
                        {
                            label:'Apilado',
                            method:'update',
                            args:[
                                    {visible: [...[false,false], ...Array(12).fill(true)]},
                                    { title: {text: 'Apilado Anual'}, barmode: 'stack', legend: { orientation: 'l' }  }
                            ]
                        },
                        {
                            label:'linea',
                            method:'update', 
                            args:[
                                {
                                    visible: [...[true,true], ...Array(12).fill(false)]
                                },
                                { title: {text:'linea'}, barmode: '',legend: { orientation: 'h' } },
                                
                            ]
                        }
                    ],
                    direction: 'left',
                    pad: {'r': 10, 't': 10},
                    showactive: true,
                    type: 'buttons',
                    x: 0.1,
                    xanchor: 'left',
                    y: 1.1,
                    yanchor: 'top'
                }
            ],
            barmode: 'stack', legend: { orientation: 'h' }
        }
        Plotly.newPlot("graf-1", traces, layout, {responsive: true});
    }
    graficarOpciones(trace1, trace2)*/
/*
function graficarOpciones(serie, titulo, yname){
        const linea = serie.lineSumTrace(col);
        linea.visible =false;
        const traces = [
            linea,
            ...this.agruparAnio(col).map(c =>({...c, visible: true}))
        ]
        const layout = {
            title: {
                text: titulo
            },
            xaxis: { 
                type: 'date',
                showgrid: false
            },
            yaxis: { 
                title: {
                    text: yname
                }, 
                rangemode: 'tozero'
            },
            updatemenus:[
                {
                    buttons:[
                        {
                            label:'Apilado',
                            method:'update',
                            args:[
                                    {visible: [false, ...Array(12).fill(true)]},
                                    { title: 'Apilado Anual', barmode: 'stack' }
                            ]
                        },
                        {
                            label:'linea',
                            method:'update',
                            args:[
                                {
                                    visible: [true, ...Array(12).fill(false)]
                                },
                                { title: 'Mensual', barmode: '' }
                            ]
                        }
                    ]
                }
            ],
            barmode: 'stack'
        }
        Plotly.newPlot(this.space, traces, layout, {responsive: true});
    }
    changeGraf(fun, newcol, newtitle, newyname){
        this[fun](newcol, newtitle, newyname)
    }
    listenOption(radioName, fun, opciones){
        const radios = document.querySelectorAll(`input[name="${radioName}"]`)
        radios.forEach(radio => {
            radio.addEventListener("change", () =>{
            const opcion = opciones[radio.id]
            console.log(opcion)
            this.changeGraf(fun, opcion.cols, opcion.titulo, opcion.yname)
        })
        })
}
*/

    /*
    graficar(cols, titulo, yname){
        
        const layout = {
            title: {
                text: titulo
            },
            xaxis: { 
                type: 'date',
                showgrid: false
            },
            yaxis: { 
                title: {
                    text: yname
                }, 
                rangemode: 'tozero'
            },
            legend: { orientation: 'h' }
        }
        Plotly.newPlot(this.space, ys, layout, {responsive: true});
    }
    
    graficarOpciones(col, titulo, yname){
        const linea = this.sumarAnio(col);
        linea.visible =false;
        const traces = [
            linea,
            ...this.agruparAnio(col).map(c =>({...c, visible: true}))
        ]
        const layout = {
            title: {
                text: titulo
            },
            xaxis: { 
                type: 'date',
                showgrid: false
            },
            yaxis: { 
                title: {
                    text: yname
                }, 
                rangemode: 'tozero'
            },
            updatemenus:[
                {
                    buttons:[
                        {
                            label:'Apilado',
                            method:'update',
                            args:[
                                    {visible: [false, ...Array(12).fill(true)]},
                                    { title: 'Apilado Anual', barmode: 'stack' }
                            ]
                        },
                        {
                            label:'linea',
                            method:'update',
                            args:[
                                {
                                    visible: [true, ...Array(12).fill(false)]
                                },
                                { title: 'Mensual', barmode: '' }
                            ]
                        }
                    ]
                }
            ],
            barmode: 'stack'
        }
        Plotly.newPlot(this.space, traces, layout, {responsive: true});
    }
    changeGraf(fun, newcol, newtitle, newyname){
        this[fun](newcol, newtitle, newyname)
    }
    listenOption(radioName, fun, opciones){
        const radios = document.querySelectorAll(`input[name="${radioName}"]`)
        radios.forEach(radio => {
            radio.addEventListener("change", () =>{
            const opcion = opciones[radio.id]
            console.log(opcion)
            this.changeGraf(fun, opcion.cols, opcion.titulo, opcion.yname)
        })
        })
    }
    */
   /*
class Serie {
    constructor(colNames, titulo, yname){
        this.colNames = colNames;
        this.titulo = titulo; 
        this.yname = yname;
    }
    normalTrace(x){
        const trace = this.colNames.map(col =>({
            x: x,
            y: 
        }))
    }
}*/



