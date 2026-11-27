import BaseController from "./BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import MessagePopover from "sap/m/MessagePopover";
import MessageView from "sap/m/MessageView";
import MessageItem from "sap/m/MessageItem";
import Button from "sap/m/Button";
import Bar from "sap/m/Bar";
import Title from "sap/m/Title";
import IconPool from "sap/ui/core/IconPool";
import { Message as ValidationMessage, TextType } from "../model/types";
import { createMessageItemTemplate } from "../utils/messageItemFactory";
import Dialog from "sap/m/Dialog";
import type Input from "sap/m/Input";
import Token from "sap/m/Token";
import MessageBox from "sap/m/MessageBox";
import MessageBoxHelper from "../utils/MessageBoxHelper";
import ODataModel from "sap/ui/model/odata/v4/ODataModel";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";

import { ValueHelpRegistry } from "../utils/ValueHelpRegistry";
import { VALUE_HELP_CONFIGS } from "../utils/valueHelpConfigs";

/**
 * @namespace com.eiffage.sdt.controller
 */
export default class CreditNote extends BaseController {
    private _valueHelpRegistry!: ValueHelpRegistry;
}