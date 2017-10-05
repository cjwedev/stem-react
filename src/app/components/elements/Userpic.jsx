import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate';
import { imageProxy } from 'app/utils/ProxifyUrl';

class Userpic extends Component {
    static propTypes = {
        account: PropTypes.string
    }

    shouldComponentUpdate = shouldComponentUpdate(this, 'Userpic')

    render() {

        const {account, json_metadata} = this.props
        const hideIfDefault = this.props.hideIfDefault || false


        // try to extract image url from users metaData
        try {
            const md = JSON.parse(json_metadata);
            if(!/^(https?:)\/\//.test(md.profile.profile_image) && hideIfDefault) {
                return null;
            }
        } catch (e) {}

        const style = {backgroundImage: 'url(' + imageProxy(`/u/${account}/avatar`) + ')' }

        return (<div className="Userpic" style={style} />)
    }
}

export default connect(
    (state, ownProps) => {
        const {account, hideIfDefault} = ownProps
        return {
            account,
            json_metadata: state.global.getIn(['accounts', account, 'json_metadata']),
            hideIfDefault,
        }
    }
)(Userpic)
