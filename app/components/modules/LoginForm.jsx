/* eslint react/prop-types: 0 */
import React, { PropTypes, Component } from 'react';
import ReactDOM from 'react-dom';
import {PublicKey} from 'shared/ecc'
import transaction from 'app/redux/Transaction'
import g from 'app/redux/GlobalReducer'
import user from 'app/redux/User'
import {validate_account_name} from 'app/utils/ChainValidation';
import runTests from 'shared/ecc/test/BrowserTests';
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate'
import reactForm from 'app/utils/ReactForm'

class LoginForm extends Component {

    static propTypes = {
        //Steemit
        login_error: PropTypes.string,
        onCancel: PropTypes.func,
    };

    static defaultProps = {
        afterLoginRedirectToAccount: false
    }

    constructor(props) {
        super()
        const cryptoTestResult = runTests();
        let cryptographyFailure = false;
        if (cryptoTestResult !== undefined) {
            console.error('CreateAccount - cryptoTestResult: ', cryptoTestResult);
            cryptographyFailure = true
        }
        this.state = {cryptographyFailure}
        this.usernameOnChange = e => {
            const value = e.target.value.toLowerCase()
            this.state.username.props.onChange(value)
        }
        this.onCancel = () => {
            const {onCancel, loginBroadcastOperation} = this.props
            const errorCallback = loginBroadcastOperation && loginBroadcastOperation.get('errorCallback')
            if (errorCallback) errorCallback('Canceled')
            if (onCancel) onCancel()
        }
        this.qrReader = () => {
            const {qrReader} = props
            const {password} = this.state
            qrReader(data => {password.props.onChange(data)})
        }
        this.initForm(props)
    }

    componentDidMount() {
        if (this.refs.username) ReactDOM.findDOMNode(this.refs.username).focus()
    }

    shouldComponentUpdate = shouldComponentUpdate(this, 'LoginForm')

    initForm(props) {
        reactForm({
            name: 'login',
            instance: this,
            fields: ['username', 'password', 'saveLogin'],
            initialValues: props.initialValues,
            validation: values => ({
                username: ! values.username ? 'Required' : validate_account_name(values.username.split('/')[0]),
                password: ! values.password ? 'Required' :
                    values.password.length < 16 ? 'Password must be 16 characters or more' :
                    PublicKey.fromString(values.password) ? 'You need a private password or key (not a public key)' :
                    null,
            })
        })
    }

    saveLoginToggle = () => {
        const {saveLogin} = this.state
        saveLoginDefault = !saveLoginDefault
        localStorage.setItem('saveLogin', saveLoginDefault ? 'yes' : 'no')
        saveLogin.props.onChange(saveLoginDefault) // change UI
    }
    showChangePassword = () => {
        const {username, password} = this.state
        this.props.showChangePassword(username.value, password.value)
    }
    render() {
        if (!process.env.BROWSER) {
            return <div className="row">
                <div className="column">
                    <p>Loading..</p>
                </div>
            </div>;
        }
        if (this.state.cryptographyFailure) {
            return <div className="row">
                <div className="column">
                    <div className="callout alert">
                        <h4>Cryptography test failed</h4>
                        <p>We will be unable to log you in with this browser.</p>
                        <p>The latest versions of <a href="https://www.google.com/chrome/">Chrome</a> and <a href="https://www.mozilla.org/en-US/firefox/new/">Firefox</a> are well tested and known to work with steemit.com.</p>
                    </div>
                </div>
            </div>;
        }

        if ($STM_Config.read_only_mode) {
            return <div className="row">
                <div className="column">
                    <div className="callout alert">
                        <p>Due to server maintenance we are running in read only mode. We are sorry for the inconvenience.</p></div>
                </div>
            </div>;
        }

        const {loginBroadcastOperation, dispatchSubmit, afterLoginRedirectToAccount, msg} = this.props;
        const {username, password, saveLogin} = this.state
        const {submitting, valid, handleSubmit} = this.state.login
        const {usernameOnChange, onCancel, /*qrReader*/} = this
        const disabled = submitting || !valid;

        const title = loginBroadcastOperation ?
            'Authenticate for this transaction' :
            'Login to your Steem Account';
        const opType = loginBroadcastOperation ? loginBroadcastOperation.get('type') : null
        const authType = /vote|comment/.test(opType) ? 'Posting, Active, or Owner' : 'Active or Owner'
        const submitLabel = loginBroadcastOperation ? 'Sign' : 'Login';
        let error = password.touched && password.error ? password.error : this.props.login_error
        if (error === 'owner_login_blocked') {
            error = <span>This password is bound to your account's owner key and can not be used to login to this site.
                However, you can use it to <a onClick={this.showChangePassword}>update your password</a> to obtain a more secure set of keys.</span>
        } else if (error === 'active_login_blocked') {
            error = <span>This password is bound to your account's active key and can not be used to login to this page.  You may use this
                active key on other more secure pages like the Wallet or Market pages.</span>
        }
        let message = null;
        if (msg) {
            if (msg === 'accountcreated') {
                message =<div className="callout primary">
                        <p>You account has been successfully created!</p>
                    </div>;
            }
            else if (msg === 'accountrecovered') {
                message =<div className="callout primary">
                    <p>You account has been successfully recovered!</p>
                </div>;
            }
            else if (msg === 'passwordupdated') {
                message = <div className="callout primary">
                    <p>The password for `{username.value}` was successfully updated.</p>
                </div>;
            }
        }
        const form = (
            <form onSubmit={handleSubmit(data => {
                // bind redux-form to react-redux
                console.log('Login\tdispatchSubmit');
                return dispatchSubmit(data, loginBroadcastOperation, afterLoginRedirectToAccount)
            })}
                onChange={this.props.clearError}
                method="post"
            >
                <div>
                    <input type="text" required placeholder="Enter your username" ref="username"
                        {...username.props} onChange={usernameOnChange} value={username.value} autoComplete="on" disabled={submitting} />
                    <div className="error">{username.touched && username.error && username.error}&nbsp;</div>
                </div>

                <div>
                    <input type="password" required ref="pw" placeholder="Password or WIF" {...password.props} autoComplete="on" disabled={submitting} />
                    <div className="error">{error}&nbsp;</div>
                </div>
                {loginBroadcastOperation && <div>
                    <div className="info">This operation requires your {authType} key (or use your master password).</div>
                </div>}
                <div>
                    <label htmlFor="saveLogin">
                        Keep me logged in &nbsp;
                        <input id="saveLogin" type="checkbox" ref="pw" {...saveLogin.props} onChange={this.saveLoginToggle} disabled={submitting} /></label>
                </div>
                <br />
                <div>
                    <button type="submit" disabled={submitting || disabled} className="button">
                        {submitLabel}
                    </button>
                    {this.props.onCancel && <button type="button float-right" disabled={submitting} className="button hollow" onClick={onCancel}>
                        Cancel
                    </button>}
                </div>
            </form>
        )

        return (
           <div className="LoginForm">
               {message}
               <h3>{title}</h3>
               <br />
               {form}
           </div>
       )
    }
}

let hasError
let saveLoginDefault = true
if (process.env.BROWSER) {
    const s = localStorage.getItem('saveLogin')
    if (s === 'no') saveLoginDefault = false
}

function urlAccountName() {
    let suggestedAccountName = null;
    const account_match = window.location.hash.match(/account\=([\w\d\-\.]+)/);
    if (account_match && account_match.length > 1) suggestedAccountName = account_match[1];
    return suggestedAccountName
}

import {connect} from 'react-redux'
export default connect(

    // mapStateToProps
    (state) => {
        const login_error = state.user.get('login_error')
        const currentUser = state.user.get('current')
        const loginBroadcastOperation = state.user.get('loginBroadcastOperation')

        const initialValues = {
            username: currentUser ? currentUser.get('username') : urlAccountName(),
            saveLogin: saveLoginDefault,
        }

        const loginDefault = state.user.get('loginDefault')
        if(loginDefault) {
            const {username, authType} = loginDefault.toJS()
            if(username && authType) initialValues.username = username + '/' + authType
        }
        let msg = '';
        const msg_match = window.location.hash.match(/msg\=([\w]+)/);
        if (msg_match && msg_match.length > 1) msg = msg_match[1];
        const fields = ['username', 'password', 'saveLogin']
        hasError = !!login_error
        return {
            login_error,
            loginBroadcastOperation,
            fields,
            initialValues,
            msg,
            offchain_user: state.offchain.get('user')
        }
    },

    // mapDispatchToProps
    dispatch => ({
        dispatchSubmit: (data, loginBroadcastOperation, afterLoginRedirectToAccount) => {
            const {password, saveLogin} = data
            const username = data.username.trim().toLowerCase()
            if (loginBroadcastOperation) {
                const {type, operation, successCallback, errorCallback} = loginBroadcastOperation.toJS()
                dispatch(transaction.actions.broadcastOperation({type, operation, username, password, successCallback, errorCallback}))
                dispatch(user.actions.usernamePasswordLogin({username, password, saveLogin, afterLoginRedirectToAccount, operationType: type}))
                if (!saveLogin) {
                    dispatch(user.actions.closeLogin())
                }
            } else {
                dispatch(user.actions.usernamePasswordLogin({username, password, saveLogin, afterLoginRedirectToAccount}))
            }
        },
        clearError: () => { if (hasError) dispatch(user.actions.loginError({error: null})) },
        qrReader: (dataCallback) => {
            dispatch(g.actions.showDialog({name: 'qr_reader', params: {handleScan: dataCallback}}));
        },
        showChangePassword: (username, defaultPassword) => {
            dispatch(user.actions.closeLogin())
            dispatch(g.actions.remove({key: 'changePassword'}))
            dispatch(g.actions.showDialog({name: 'changePassword', params: {username, defaultPassword}}))
        },
    })
)(LoginForm)
