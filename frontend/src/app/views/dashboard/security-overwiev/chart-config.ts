//TODO: make this object not type any
export const securityOverviewChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
        duration: 1000,
        easing: 'easeOutQuart'
    },
    plugins: {
        legend: {
            position: 'top',
            labels: {
                boxWidth: 12,
                usePointStyle: true,
                pointStyle: 'circle',
                padding: 15,
                font: {
                    size: 11,
                    weight: 'bold'
                }
            }
        },
        tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(33, 37, 41, 0.85)',
            titleFont: {
                size: 13,
                weight: 'bold'
            },
            bodyFont: {
                size: 12
            },
            padding: 10,
            cornerRadius: 4,
            displayColors: true,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            caretSize: 6,
            callbacks: {
                label: function(context: any) {
                    let label = context.dataset.label || '';
                    if (label) {
                        label += ': ';
                    }
                    if (context.parsed.y !== null) {
                        label += context.parsed.y;
                    }
                    return label;
                }
            }
        }
    },
    scales: {
        x: {
            grid: {
                display: false,
                drawBorder: false
            },
            ticks: {
                maxRotation: 0,
                padding: 8,
                font: {
                    size: 10
                },
                color: 'rgba(120, 130, 140, 0.8)'
            }
        },
        y: {
            beginAtZero: true,
            grid: {
                color: 'rgba(120, 130, 140, 0.1)',
                drawBorder: false,
                lineWidth: 1,
                drawTicks: false
            },
            ticks: {
                padding: 10,
                count: 5,
                stepSize: Math.ceil(10 / 5),
                font: {
                    size: 10
                },
                color: 'rgba(120, 130, 140, 0.8)'
            },
            border: {
                display: false
            }
        }
    },
    layout: {
        padding: {
            top: 10,
            right: 15,
            bottom: 15,
            left: 15
        }
    },
    elements: {
        line: {
            tension: 0.35
        },
        point: {
            radius: 2,
            hitRadius: 30,
            hoverRadius: 5
        }
    },
    interaction: {
        mode: 'index',
        intersect: false
    },
    hover: {
        mode: 'nearest',
        intersect: false,
        animationDuration: 200
    }
};