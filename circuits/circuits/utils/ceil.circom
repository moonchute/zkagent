pragma circom 2.1.8;

function ceil(value, precision) {
    return (value + precision - 1) \ precision * precision;
}