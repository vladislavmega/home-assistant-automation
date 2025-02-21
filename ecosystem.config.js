module.exports = {
    apps: [{
        name: 'light',
        instances: 1,
        script: "npm",
        args : "start",
        exec_mode: 'cluster',
    }],
};
