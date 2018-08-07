// import { dom, h } from "maquette";
import * as test from "tape";

import * as fixtures from "./fixtures";

import { SimControl } from "../sim-control";
import { MockConnection } from "../server";

test("SimControl.status", assert => {
    const dom = new fixtures.DOM(assert);
    const sim = new SimControl(new MockConnection(), 4.0, 0.5);

    assert.equal(sim.status, "paused");
    assert.equal(sim.paused, true);
    assert.equal(sim.view.pauseIcon, "play");
    assert.equal(sim.view.spinPause, false);

    sim.status = "building";
    assert.equal(sim.status, "building");
    assert.equal(sim.paused, false);
    assert.equal(sim.view.pauseIcon, "cog");
    assert.equal(sim.view.spinPause, true);

    fixtures.teardown(assert, dom);
});

test("SimControl sends", assert => {
    const dom = new fixtures.DOM(assert);
    const server = new MockConnection();
    const sim = new SimControl(server, 4.0, 0.5);

    sim.setBackend("test");
    assert.equal(server.lastSentName, "simcontrol.set_backend");
    assert.deepEqual(server.lastSent, { backend: "test" });

    sim.play();
    assert.equal(server.lastSentName, "simcontrol.play");
    assert.deepEqual(server.lastSent, {});

    sim.status = "running";
    sim.pause();
    assert.equal(server.lastSentName, "simcontrol.pause");
    assert.deepEqual(server.lastSent, {});

    sim.reset();
    assert.equal(sim.status, "paused");
    assert.ok(sim.paused);
    assert.equal(server.lastSentName, "simcontrol.reset");
    assert.deepEqual(server.lastSent, {});

    fixtures.teardown(assert, dom);
});

test("TimeSlider.addTime", assert => {
    const dom = new fixtures.DOM(assert);
    const ts = new SimControl(new MockConnection(), 4.0, 0.5).timeSlider;
    const tolerance = 1e-5;

    // Increasing times
    [0.001, 0.01, 0.1, 1.0].forEach(time => {
        ts.addTime(time);
        assert.equal(ts.timeCurrent, time);
        assert.ok((ts.timeShown - ts.shownWidth) - (ts.timeShown + time) <= tolerance);
    });

    // When time goes backward, we reset
    ts.addTime(0.5);
    assert.equal(ts.timeCurrent, 0);

    fixtures.teardown(assert, dom);
});

test("TimeSlider.reset", assert => {
    const dom = new fixtures.DOM(assert);
    const sim = new SimControl(new MockConnection(), 4.0, 0.5);
    const ts = sim.timeSlider;

    ts.addTime(0.1);
    assert.equal(ts.timeCurrent, 0.1);
    ts.reset();
    assert.equal(ts.timeCurrent, 0);
    ts.addTime(0.1);
    assert.equal(ts.timeCurrent, 0.1);
    sim.view.reset.dispatchEvent(new Event("click"));
    assert.equal(ts.timeCurrent, 0);

    fixtures.teardown(assert, dom);
});
