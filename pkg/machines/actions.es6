/*jshint esversion: 6 */
/*
 * This file is part of Cockpit.
 *
 * Copyright (C) 2016 Red Hat, Inc.
 *
 * Cockpit is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation; either version 2.1 of the License, or
 * (at your option) any later version.
 *
 * Cockpit is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Cockpit; If not, see <http://www.gnu.org/licenses/>.
 */
import cockpit from 'cockpit';
import { getRefreshInterval } from './selectors.es6';
import VMS_CONFIG from "./config.es6";
import { logDebug } from './helpers.es6';
import { virt } from './provider.es6';

/**
 * All actions dispatchable by in the application
 */

// --- Provider actions -----------------------------------------
/**
 *
 * @param connectionName optional - if `undefined` then for all connections
 */
export function getAllVms(connectionName) {
    return virt('GET_ALL_VMS', {connectionName});
}

export function getVm(connectionName, lookupId) {
    return virt('GET_VM', {
        lookupId, // provider-specific (i.e. libvirt uses vm_name)
        connectionName
    });
}

export function shutdownVm(vm) {
    return virt('SHUTDOWN_VM', { name: vm.name, id: vm.id, connectionName: vm.connectionName });
}

export function forceVmOff(vm) {
    return virt('FORCEOFF_VM', { name: vm.name, id: vm.id, connectionName: vm.connectionName });
}

export function rebootVm(vm) {
    return virt('REBOOT_VM', { name: vm.name, id: vm.id, connectionName: vm.connectionName });
}

export function forceRebootVm(vm) {
    return virt('FORCEREBOOT_VM', { name: vm.name, id: vm.id, connectionName: vm.connectionName });
}

export function startVm(vm) {
    return virt('START_VM', { name: vm.name, id: vm.id, connectionName: vm.connectionName });
}

/**
 * Delay call of polling action.
 *
 * To avoid execution overlap, the setTimeout() is used instead of setInterval().
 *
 * The delayPolling() function is called after previous execution is finished so
 * the refresh interval starts counting since that moment.
 *
 * If the application is not visible, the polling action execution is skipped
 * and scheduled on later.
 *
 * @param action I.e. getAllVms()
 */
export function delayPolling(action, timeout) {
    return (dispatch, getState) => {
        timeout = timeout || getRefreshInterval(getState());

        if (timeout > 0 && !cockpit.hidden) {
            logDebug(`Scheduling ${timeout} ms delayed action`);
            window.setTimeout(() => {
                logDebug('Executing delayed action');
                dispatch(action);
            }, timeout);
        } else {
            // logDebug(`Skipping delayed action since refreshing is switched off`);
            window.setTimeout(() => dispatch(delayPolling(action, timeout)), VMS_CONFIG.DefaultRefreshInterval);
        }
    };
}

// --- Store actions --------------------------------------------
export function setProvider(provider) {
    return {
        type: 'SET_PROVIDER',
        provider
    };
}

export function setRefreshInterval(refreshInterval) {
    return {
        type: 'SET_REFRESH_INTERVAL',
        refreshInterval
    };
}

export function updateOrAddVm({ id, name, connectionName, state, osType, fqdn, uptime, currentMemory, rssMemory, vcpus, autostart,
    actualTimeInMs, cpuTime, disks }) {
    let vm = {};

    if (id !== undefined) vm.id = id;
    if (name !== undefined) vm.name = name;
    if (connectionName !== undefined) vm.connectionName = connectionName;
    if (state !== undefined) vm.state = state;
    if (osType !== undefined) vm.osType = osType;
    if (currentMemory !== undefined) vm.currentMemory = currentMemory;
    if (rssMemory !== undefined) vm.rssMemory = rssMemory;
    if (vcpus !== undefined) vm.vcpus = vcpus;
    if (fqdn !== undefined) vm.fqdn = fqdn;
    if (uptime !== undefined) vm.uptime = uptime;
    if (autostart !== undefined) vm.autostart = autostart;
    if (disks !== undefined) vm.disks = disks;

    if (actualTimeInMs !== undefined) vm.actualTimeInMs = actualTimeInMs;
    if (cpuTime !== undefined) vm.cpuTime = cpuTime;

    return {
        type: 'UPDATE_ADD_VM',
        vm
    };
}

export function updateVmDisksStats({ id, name, connectionName, disksStats }) {
    return {
        type: 'UPDATE_VM_DISK_STATS',
        payload: {
            id,
            name,
            connectionName,
            disksStats,
        }
    };
}

export function vmActionFailed({ name, connectionName, message, detail}) {
    return {
        type: 'VM_ACTION_FAILED',
        payload: {
            name,
            connectionName,
            message,
            detail
        }
    };
}

export function deleteUnlistedVMs(connectionName, vmNames) {
    return {
        type: 'DELETE_UNLISTED_VMS',
        vmNames,
        connectionName
    };
}
