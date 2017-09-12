import React from "react";
import { mount } from "enzyme";
import { MemoryRouter, Route } from "react-router";
import PrivateRoute from "./PrivateRoute";

it("expect to render", () => {
  mount(
    <MemoryRouter>
      <PrivateRoute path="/" authed={true} component={() => <div />} />
    </MemoryRouter>
  );
});

it("expect to render", () => {
  mount(
    <MemoryRouter>
      <div>
        <PrivateRoute exact path="/" authed={false} component={() => {}} />
        <Route path="/login" component={() => <div />} />
      </div>
    </MemoryRouter>
  );
});
