import {ArcElement, Plugin} from 'chart.js';

export interface VariableThicknessDataset {
    thickness?: number[];
}

export const variableOuterRadiusPlugin: Plugin<'doughnut'> = {
    id: 'variableOuterRadius',

    beforeDatasetDraw(chart, args, options) {
        const { ctx } = chart;
        const dataset = chart.data.datasets[args.index] as VariableThicknessDataset;
        const meta = chart.getDatasetMeta(args.index);

        if (!dataset.thickness) return;

        const arcs = meta.data as ArcElement[];
        if (!arcs.length) return;

        // fixed shared inner radius
        const fixedInnerRadius = arcs[0].innerRadius;

        arcs.forEach((arc: any, index: number) => {
            const thickness = dataset.thickness![index] ?? 20;
            const outerRadius = fixedInnerRadius + thickness;

            ctx.save();
            ctx.beginPath();

            // Outer arc
            ctx.arc(arc.x, arc.y, outerRadius, arc.startAngle, arc.endAngle);

            // Inner arc (reversed)
            ctx.arc(
                arc.x,
                arc.y,
                fixedInnerRadius,
                arc.endAngle,
                arc.startAngle,
                true
            );

            ctx.closePath();
            ctx.fillStyle = arc.options.backgroundColor;
            ctx.fill();
            ctx.restore();
        });

        // Prevent normal drawing
        return false;
    }
};