// @ts-nocheck
/**
 * @synced-from pie-elements/packages/math-templated/src/index.js
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import {SessionChangedEvent, ModelSetEvent} from '@pie-element/shared-player-events';
import Main from './main';
import _ from 'lodash-es';

export default class MathTemplated extends HTMLElement {
    constructor() {
        super();
        this._root = null;
        this.sessionChangedEventCaller = _.debounce(() => {
            this.dispatchEvent(new SessionChangedEvent(this.tagName.toLowerCase(), true));
        }, 1000);
    }

    set model(m) {
        this._model = m;

        this.render();
        this.dispatchEvent(new ModelSetEvent(this.tagName.toLowerCase(), this.isSessionComplete(), this._model !== undefined));
    }

    get model() {
        return this._model;
    }

    set session(s) {
        this._session = s;

        this.render();
    }

    get session() {
        return this._session;
    }

    isSessionComplete() {
        // a method to check if student answered the question
        return true;
    }

    onSessionChange(session) {
        // you can add an extra step here to validate session
        Object.keys(session).map((key) => {
            this._session[key] = session[key];
        });

        this.sessionChangedEventCaller();
        this.render();
    }

    connectedCallback() {
        // TODO set accessibility labels

        this.render();
    }

    render() {
        if (!this._model || !this._session) {
            return;
        }

        if (this._model && this._session) {
            const el = React.createElement(Main, {
                model: this._model,
                session: this._session,
                onSessionChange: this.onSessionChange.bind(this),
            });

            if (!this._root) {
                this._root = createRoot(this);
            }
            this._root.render(el);
        }
    }

    disconnectedCallback() {
        if (this._root) {
            this._root.unmount();
        }
    }
}
