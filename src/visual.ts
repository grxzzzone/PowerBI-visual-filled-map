/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/
"use strict";

import "core-js/stable";
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;

import IVisualHost = powerbi.extensibility.IVisualHost;
import ISelectionId = powerbi.visuals.ISelectionId;

import { VisualSettings } from "./settings";
import { worldMap } from "./worldMap";
import { dataViewModel } from "./dataViewModel";
import { stateInfo } from "./stateInfo";

import * as d3 from "d3";
import * as geo from "d3-geo";
import * as scale from "d3-scale";
import { GeoGeometryObjects } from "d3";

type Selection<T extends d3.BaseType> = d3.Selection<T, any,any, any>;

/*function visualTransform(options: VisualUpdateOptions, host: IVisualHost): any {
        let dataViews = options.dataViews;
        let viewModel: dataViewModel = {
                "map": "world",
                "data": {},
                "ei":null,
                "statedetails":{}
            };
        
            if (!dataViews
                || !dataViews[0]
                || !dataViews[0].categorical
                || !dataViews[0].categorical.categories
                || !dataViews[0].categorical.categories[0].source
                || !dataViews[0].categorical.values
                || dataViews[0].categorical.categories[0].values.length != dataViews[0].categorical.values[0].values.length
            ) {
                return viewModel;
            }
        let categorical = dataViews[0].categorical;
        let category = categorical.categories[0];
        let dataValue = categorical.values[0];
        let data = {};

        for (let i = 0, len = category.values.length; i < len; i++) {

                data[category.values[i].toString()] = {EI:parseFloat(dataValue.values[i].toString())};
        }

        if(category.values.length == 1)
        {
                viewModel.ei = parseFloat(dataValue.values[0].toString());
                viewModel.statedetails = stateInfo.filter(state => state["ISO Alpha-3 Code"] == category.values[0].toString())[0];
        }
        
        viewModel.data = data;
        return viewModel;
}*/

export class Visual implements IVisual {
    private host: IVisualHost;
    private svg: Selection<SVGElement>;
    private container: Selection<SVGElement>;
    private map: Selection<SVGElement>;
    private legendbox1: Selection<SVGElement>;
    private legendbox2: Selection<SVGElement>;
    private legendbox3: Selection<SVGElement>;
    private legendbox4: Selection<SVGElement>;
    private legendbox5: Selection<SVGElement>;
    private mintext: Selection<SVGElement>;
    private midtext: Selection<SVGElement>;
    private maxtext: Selection<SVGElement>;
    private metrictext: Selection<SVGElement>;
    private stateName: Selection<SVGElement>;
    private statePoint: Selection<SVGElement>;


    private visualSettings: VisualSettings;

    constructor(options: VisualConstructorOptions) {
        this.svg = d3.select(options.element)
            .append('svg')
            .classed('worldMap', true);
        this.container = this.svg.append("g")
            .classed('container', true);
        this.map = this.container.append("g");
            
        this.container.append("defs:linearGradient")
            .attr("id","grad1")
            .attr("x1","0%")
            .attr("x2","100%")
            .attr("y1","0%")
            .attr("y2","0%");
        this.container.select("#grad1")
            .append("stop")
            .attr("offset","0%")
            .style("stop-color","red")
            .style("stop-opacity",1);
        this.container.select("#grad1")
            .append("stop")
            .attr("offset","100%")
            .style("stop-color","yellow")
            .style("stop-opacity",1);
        this.container.append("defs:linearGradient")
            .attr("id","grad2")
            .attr("x1","0%")
            .attr("x2","100%")
            .attr("y1","0%")
            .attr("y2","0%");
        this.container.select("#grad2")
            .append("stop")
            .attr("offset","0%")
            .style("stop-color","yellow")
            .style("stop-opacity",1);
        this.container.select("#grad2")
            .append("stop")
            .attr("offset","100%")
            .style("stop-color","green")
            .style("stop-opacity",1);

        this.legendbox1 = this.container.append("rect");
        this.legendbox2 = this.container.append("rect");
        this.legendbox3 = this.container.append("rect");
        this.legendbox4 = this.container.append("rect");
        this.legendbox5 = this.container.append("rect");
        this.mintext = this.container.append("text");
        this.midtext = this.container.append("text");
        this.maxtext = this.container.append("text");
        this.metrictext = this.container.append("text");
        this.stateName = this.container.append("text");
        this.statePoint = this.container.append("circle");

    }

    public update(options: VisualUpdateOptions) {
        
        //this.visualSettings = VisualSettings.parse<VisualSettings>(dataView);
        //let viewModel: any = visualTransform(options, this.host);
        let dataViews = options.dataViews;
        let viewModel: dataViewModel = {
                "map": "world",
                "data": {},
                "ei":null,
                "statedetails":{
                        "ISO Alpha-3 Code": null,
                        "Latitude": null,
                        "Longitude": null,
                        "UN State Name": null
                }
            };
        
            /*if (!dataViews
                || !dataViews[0]
                || !dataViews[0].categorical
                || !dataViews[0].categorical.categories
                || !dataViews[0].categorical.categories[0].source
                || !dataViews[0].categorical.values
                || dataViews[0].categorical.categories[0].values.length != dataViews[0].categorical.values[0].values.length
            ) {
                return viewModel;
            }*/
        let categorical = dataViews[0].categorical;
        let category = categorical.categories[0];
        let dataValue = categorical.values[0];
        let data = {};

        for (let i = 0, len = category.values.length; i < len; i++) {

                data[category.values[i].toString()] = {EI:parseFloat(dataValue.values[i].toString())};
        }

        if(category.values.length == 1)
        {
                viewModel.ei = parseFloat(dataValue.values[0].toString());
                viewModel.statedetails = stateInfo.filter(state => state["ISO Alpha-3 Code"] == category.values[0].toString())[0];
        }
        
        viewModel.data = data;
        

        let width: number = options.viewport.width;
        let height: number = options.viewport.height;
        this.svg.attr("width", width);
        this.svg.attr("height", height);
        //this.svg.attr("viewBox", "0 0 "+width+" " +height)
        //this.svg.attr("preserveAspectRatio", "xMinYMin meet");
        

        /*let projection = geo.geoEquirectangular()
                            .scale(width /7.5)
                            .translate([width / 2, height / 2]);*/
        let projection = d3.geoEquirectangular().fitExtent(
                [[10,(height-20)*0.125],[width-20,(height-20)*0.75]],<GeoGeometryObjects>worldMap
        );

        let path = geo.geoPath(projection)
                        //.projection(projection);
        
        

        let dom = d3.scaleLinear([0,50,100], ['red',"yellow","green"]);

        this.map
                .attr("id", "states")
                .selectAll("path")
                .data(worldMap.features)
                .enter().append("path")
                .attr("d", path)
                .attr("id",function(d){return d.id})
                .style("fill",function(d){ 
                    var c="lightgray"
                    if (viewModel.data[d.id]) {
                            c=dom(viewModel.data[d.id].EI)
                        }
                        return c
                    })
                /*.style("fill-opacity",function(d){ 
                            var c=0.5
                            if (map.group.indexOf(d.id)>=0) {
                                c=1}
                            return c
                        })
                      .style("stroke",function(d){
                                if (map.group.indexOf(d.id)>=0) {
                                    return "gray"}
                                else {
                                    return "#fff"}
                                })*/
                .style("stroke-width", 0.5);
                //.attr("width", width);
        this.legendbox1        
                .attr("id","legendbox1")
                .attr("class","mainlegend")
                .attr("x",20)
                .attr("y",height-20)
                .attr("width",50)
                .attr("height",10)
                .style("fill","url(#grad1)");
        this.legendbox2
                .attr("id","legendbox2")
                .attr("class","mainlegend")
                .attr("x",70)
                .attr("y",height-20)
                .attr("width",50)
                .attr("height",10)
                .style("fill","url(#grad2)");
        this.legendbox3
                .attr("id","legendbox3")
                .attr("class","secondlegend")
                .attr("x",20)
                .attr("y",height-20)
                .attr("width",10)
                .attr("height",10)
                .style("display","none");
        this.legendbox4
                .attr("id","legendbox4")
                .attr("class","secondlegend")
                .attr("x",30)
                .attr("y",height-20)
                .attr("width",80)
                .attr("height",10)
                .style("display","none");
        this.legendbox5
                .attr("id","legendbox5")
                .attr("class","secondlegend")
                .attr("x",110)
                .attr("y",height-20)
                .attr("width",10)
                .attr("height",10)
                .style("display","none");
            
            
        this.mintext
                .attr("id","mintext")
                .attr("x",15)
                .attr("y",height-23)
                .text("0%")
                .style("font-size","10px");
        this.midtext
                .attr("id","midtext")
                .attr("x",65)
                .attr("y",height-23)
                .text("50%")
                .style("font-size","10px"); 
        this.maxtext
                .attr("id","maxtext")
                .attr("x",115)
                .attr("y",height-23)
                .text("100%")
                .style("font-size","10px");	
        this.metrictext
                .attr("id","metrictext")
                .attr("x",15)
                .attr("y",height-33)
                .text("Overall EI")
                .style("font-size","10px");	
        if(viewModel.statedetails["ISO Alpha-3 Code"])
        {
                this.stateName
                .attr("x",7+projection([viewModel.statedetails.Longitude,viewModel.statedetails.Latitude])[0])
                .attr("y",3+projection([viewModel.statedetails.Longitude,viewModel.statedetails.Latitude])[1])
                .text(viewModel.statedetails["UN State Name"])
                .style("font-weight","bold");
                this.statePoint
                .attr("cx",projection([viewModel.statedetails.Longitude,viewModel.statedetails.Latitude])[0])
                .attr("cy",projection([viewModel.statedetails.Longitude,viewModel.statedetails.Latitude])[1])
                .attr("r",5)
                .style("fill",dom(viewModel.ei))
                .style("stroke","blue")
                .style("stroke-width",1)
                .style("visibility","visible");
        }
        else{
                this.stateName.text("");
                this.statePoint.style("visibility","hidden");
        }
        
        /*if (map.sscs) {
            this.svg.append("image")
            .attr("x",-5+projection([map.statedetails.Longitude,map.statedetails.Latitude])[0])
            .attr("y",-20+projection([map.statedetails.Longitude,map.statedetails.Latitude])[1])
            .attr("height",20)
            .attr("width",20)
            .attr("xlink:href","https://portal.icao.int/space/PublishingImages/redflag.png")
        }*/
    }

    private static parseSettings(dataView: DataView): VisualSettings {
        return <VisualSettings>VisualSettings.parse(dataView);
    }

    /**
     * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
     * objects and properties you want to expose to the users in the property pane.
     *
     */
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        const settings: VisualSettings = this.visualSettings || <VisualSettings>VisualSettings.getDefault();
        return VisualSettings.enumerateObjectInstances(settings, options);
    }
}

