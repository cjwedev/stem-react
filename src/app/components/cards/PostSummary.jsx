import React from 'react';
import { Link, browserHistory } from 'react-router';
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper';
import Icon from 'app/components/elements/Icon';
import { connect } from 'react-redux';
import user from 'app/redux/User';
import Reblog from 'app/components/elements/Reblog';
import Voting from 'app/components/elements/Voting';
import {immutableAccessor} from 'app/utils/Accessors';
import extractContent from 'app/utils/ExtractContent';
import VotesAndComments from 'app/components/elements/VotesAndComments';
import {Map} from 'immutable';
import Author from 'app/components/elements/Author';
import TagList from 'app/components/elements/TagList';
import UserNames from 'app/components/elements/UserNames';
import tt from 'counterpart';
import ImageUserBlockList from 'app/utils/ImageUserBlockList';
import proxifyImageUrl from 'app/utils/ProxifyUrl';
import Userpic from 'app/components/elements/Userpic';

function isLeftClickEvent(event) {
    return event.button === 0
}

function isModifiedEvent(event) {
    return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
}

function navigate(e, onClick, post, url) {
    if (isModifiedEvent(e) || !isLeftClickEvent(e)) return;
    e.preventDefault();
    if (onClick) onClick(post, url);
    else browserHistory.push(url);
}

class PostSummary extends React.Component {
    static propTypes = {
        post: React.PropTypes.string.isRequired,
        pending_payout: React.PropTypes.string.isRequired,
        total_payout: React.PropTypes.string.isRequired,
        content: React.PropTypes.object.isRequired,
        thumbSize: React.PropTypes.string,
        nsfwPref: React.PropTypes.string,
        onClick: React.PropTypes.func
    };

    constructor() {
        super();
        this.state = {revealNsfw: false}
        this.onRevealNsfw = this.onRevealNsfw.bind(this)
    }

    shouldComponentUpdate(props, state) {
        return props.thumbSize !== this.props.thumbSize ||
            props.pending_payout !== this.props.pending_payout ||
            props.total_payout !== this.props.total_payout ||
            props.username !== this.props.username ||
            props.nsfwPref !== this.props.nsfwPref ||
            state.revealNsfw !== this.state.revealNsfw;
    }

    onRevealNsfw(e) {
        e.preventDefault();
        this.setState({revealNsfw: true})
    }

    render() {
        const {thumbSize, ignore, onClick} = this.props;
        const {post, content} = this.props;
        const {account} = this.props;
        if (!content) return null;

        let reblogged_by;
        if(content.get('reblogged_by') && content.get('reblogged_by').size > 0) {
            reblogged_by = content.get('reblogged_by').toJS()
        }

        if(reblogged_by) {
            reblogged_by = (
                <div className="articles__resteem">
                    <p className="articles__resteem-text">
                        <span className="articles__resteem-icon"><Icon name="reblog" /></span>
                        {tt('postsummary_jsx.resteemed_by')} <UserNames names={reblogged_by} />
                    </p>
                </div>)
        }

        // 'account' is the current blog being viewed, if applicable.
        if(account && account != content.get('author')) {
            reblogged_by = (<div className="PostSummary__reblogged_by">
                               <Icon name="reblog" /> {tt('postsummary_jsx.resteemed')}
                           </div>)
        }

        const {gray, authorRepLog10, flagWeight, isNsfw} = content.get('stats', Map()).toJS()
        const p = extractContent(immutableAccessor, content);
        const desc = p.desc

        const archived = content.get('cashout_time') === '1969-12-31T23:59:59' // TODO: audit after HF17. #1259
        const full_power = content.get('percent_steem_dollars') === 0;

        let title_link_url;
        let title_text = p.title;
        let comments_link;

        if( content.get( 'parent_author') !== "" ) {
           title_text = tt('g.re_to', {topic: content.get('root_title')});
           title_link_url = content.get( 'url' );
           comments_link = title_link_url;
        } else {
            title_link_url = p.link;
            comments_link = p.link + '#comments';
        }

        const content_body = (<div className="PostSummary__body entry-content">
            <a href={title_link_url} onClick={e => navigate(e, onClick, post, title_link_url)}>{desc}</a>
        </div>);
        const content_title = (<h2 className="articles__h2 entry-title">
            <a href={title_link_url} onClick={e => navigate(e, onClick, post, title_link_url)}>
                {isNsfw && <span className="nsfw-flag">nsfw</span>}
                {title_text}
                {full_power && <span title={tt('g.powered_up_100')}><Icon name="steem" /></span>}
            </a>
        </h2>);

        // author and category
        const author_category = (<span className="vcard">
            <Userpic account={p.author} listView={true} />
            <Author author={p.author} authorRepLog10={authorRepLog10} follow={false} mute={false} />
            {} {tt('g.in')} <TagList post={p} single />&nbsp;•&nbsp;
            <a href={title_link_url} onClick={e => navigate(e, onClick, post, title_link_url)}><TimeAgoWrapper date={p.created} className="updated" /></a>
        </span>);

        // author and category
        const summary_header = (
            <div className="articles__summary-header">
            <div className="user">
                <div className="user__col user__col--left">
                    <a className="user__link" href={'/@' + p.author}>
                        <Userpic account={p.author} listView={true} />
                    </a>
                </div>
                <div className="user__col user__col--right">
                    <a className="user__link" href={'/@' + p.author}>
                        <span className="user__name"><Author author={p.author} authorRepLog10={authorRepLog10} follow={false} mute={false} /></span>
                    </a>
                    <span className="articles__tag-link">{tt('g.in')}&nbsp;<TagList post={p} single />&nbsp;•&nbsp;</span>
                    <a className="timestamp__link" href={title_link_url} onClick={e => navigate(e, onClick, post, title_link_url)}>
                        <span className="timestamp__time"><TimeAgoWrapper date={p.created} className="updated" /></span>
                    </a>
                </div>
            </div>
            <div className="articles__flag">
              <Voting post={post} flag />  
            </div>
          </div>
        );

        const content_footer = (<div className="PostSummary__footer">
            <Voting post={post} showList={false} />
            <VotesAndComments post={post} commentsLink={comments_link} />
            <span className="PostSummary__time_author_category">
                {!archived && <Reblog author={p.author} permlink={p.permlink} parent_author={p.parent_author} />}
                <span className="show-for-medium">
                    {author_category}
                </span>
            </span>
        </div>)

        const summary_footer = (
            <div className="PostSummary__footer">
                <Voting post={post} showList={false} />
                <VotesAndComments post={post} commentsLink={comments_link} />
                <span className="PostSummary__time_author_category">
                    {!archived && <Reblog author={p.author} permlink={p.permlink} parent_author={p.parent_author} />}
                </span>
            </div>
        )        

        const {nsfwPref, username} = this.props
        const {revealNsfw} = this.state

        if(isNsfw) {
            if(nsfwPref === 'hide') {
                // user wishes to hide these posts entirely
                return null;
            } else if(nsfwPref === 'warn' && !revealNsfw) {
                // user wishes to be warned, and has not revealed this post
                return (
                    <article className={'PostSummary hentry'} itemScope itemType ="http://schema.org/blogPost">
                        <div className="PostSummary__nsfw-warning">
                            <div className="PostSummary__time_author_category_small show-for-small-only">
                                {author_category}
                            </div>
                            {tt('postsummary_jsx.this_post_is')} <span className="nsfw-flag">nsfw</span>.
                            {tt('postsummary_jsx.you_can')} <a href="#" onClick={this.onRevealNsfw}>{tt('postsummary_jsx.reveal_it')}</a> {tt('g.or') + ' '}
                            {username ? <span>{tt('postsummary_jsx.adjust_your')} <Link to={`/@${username}/settings`}>{tt('postsummary_jsx.display_preferences')}</Link>.</span>
                                : <span><Link to="/pick_account">{tt('postsummary_jsx.create_an_account')}</Link> {tt('postsummary_jsx.to_save_your_preferences')}.</span>}
                            {content_footer}
                        </div>
                    </article>
                )
            }
        }

        const userBlacklisted = ImageUserBlockList.includes(p.author)

        let thumb = null;
        if(!gray && p.image_link && !userBlacklisted) {
          
          {/* const size = (thumbSize == 'mobile') ? '640x480' : '256x512';  */}

          const size = (thumbSize == 'mobile') ? '640x480' : '640x480';


          const url = proxifyImageUrl(p.image_link, size)
          if(thumbSize == 'mobile') {
            thumb = <span onClick={e => navigate(e, onClick, post, p.link)} className="PostSummary__image-mobile"><img className="articles__feature-img" src={url} /></span>
          } else {
            thumb = <span onClick={e => navigate(e, onClick, post, p.link)} className="PostSummary__image-mobile"><img className="articles__feature-img" src={url} /></span>
              {/* thumb = <span onClick={e => navigate(e, onClick, post, p.link)} className="PostSummary__image" style={{backgroundImage: 'url(' + url + ')'}}></span>  */}
          }
        }
        const commentClasses = []
        if(gray || ignore) commentClasses.push('downvoted') // rephide

        return (
            <div>
            {reblogged_by}
            {summary_header}

                <div className={'articles__content PostSummary hentry' + (thumb ? ' with-image ' : ' ') + commentClasses.join(' ')} itemScope itemType ="http://schema.org/blogPost">
                    <div className="articles__content-block articles__content-block--img">
                        <a className="articles__link" href="#">
                            {thumb}
                        </a>
                    </div>                            

                                            {/* 
                    <div className="PostSummary__header show-for-small-only">
                        {content_title}
                    </div>
                    <div className="PostSummary__time_author_category_small show-for-small-only">
                        {author_category}
                    </div>  */}
                    <div className="articles__content-block articles__content-block--text">                    
                        {content_title}
                        {content_body}
                        {summary_footer}
                    </div>
                </div>

            </div>
        )
    }
}

export default connect(
    (state, props) => {
        const {post} = props;
        const content = state.global.get('content').get(post);
        let pending_payout = 0;
        let total_payout = 0;
        if (content) {
            pending_payout = content.get('pending_payout_value');
            total_payout = content.get('total_payout_value');
        }
        return {
            post, content, pending_payout, total_payout,
            username: state.user.getIn(['current', 'username']) || state.offchain.get('account')
        };
    },

    (dispatch) => ({
        dispatchSubmit: data => { dispatch(user.actions.usernamePasswordLogin({...data})) },
        clearError: () => { dispatch(user.actions.loginError({error: null})) }
    })
)(PostSummary)
