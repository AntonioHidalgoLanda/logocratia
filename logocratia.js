class PollWithArgumentation {
//  static singelton = new PollWithArgumentation();
  constructor() {
    this.title = "";
    this.candidates = {};
    this.argumentations = {};
    this.electorate = {};
  }
 
  slug_it(){
    return [...arguments].join('-')
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "")
  }
  
  addElectorate(name){
    var id = this.slug_it(name);
    this.electorate[id] = name;
    return this;
  }
  
  addCandidate(summay){
    var id = this.slug_it(summay);
    this.candidates[id] = summay;
    return this;
  }
  
  addArgumentation(summary, candidate_id){
    var id = this.slug_it(summary, candidate_id);
    this.argumentations[id] = {
      "summary": summary,
      "candidate_id": candidate_id,
      "votes": {}
    };
    return this;
  }
  
  getElectorate(id){
    return this.electorate[id];
  }
  
  getCandidate(id){
    return this.candidates[id];
  }
  
  getArgumentation(id){
    return this.argumentations[id];
  }
  
  getElectorateKeys() {
    return Object.keys(this.electorate);
  }
  
  getCandidateKeys() {
    return Object.keys(this.candidates);
  }
  
  getArgumentationKeys() {
    return Object.keys(this.argumentations);
  }
  
  vote(electorate_id, argumentation_id, vote){
    if (this.argumentations.hasOwnProperty(argumentation_id)) {
        this.argumentations[argumentation_id]
           .votes[electorate_id] = vote;
    }
    return self
  }
  
  results() {
    var results = {};
    for (let [arg_id, arg] of Object.entries(this.argumentations)) {
      if (!results.hasOwnProperty(arg.candidate_id)){
        results[arg.candidate_id] = 0;
      }
      for (let [voter, vote] of Object.entries(arg.votes)) {
        results[arg.candidate_id] += parseInt(vote);
      }
    }
    return results;
  }
  
  export_to_JSON() {
    return JSON.stringify(this);
  }
  
  /* TODO - Management of exceptions and corrupted files */
  import_from_JSON(json_str) {
  	var json_obj = JSON.parse(json_str)
    this.title = json_obj.title;
    this.candidates = {};
    Object.keys(json_obj.candidates).map(
		  (id) => this.addCandidate(json_obj.candidates[id]));
    this.electorate = {};
    Object.keys(json_obj.electorate).map(
		  (id) => this.addElectorate(json_obj.electorate[id]));
    this.argumentations = {};
    Object.keys(json_obj.argumentations).map((id) => {
		  var argumentation = json_obj.argumentations[id]
		  this.addArgumentation(argumentation['summary'], argumentation['candidate_id']);
      if (argumentation.hasOwnProperty('votes')){
        this.argumentations[id].votes = argumentation.votes; // TODO Warning this is a shallow copy and it should be a deep copy
      }
	});
    return this;
  }  
}
PollWithArgumentation.singelton = new PollWithArgumentation();

/*
everything: {Results, Poll, ArgumentManager, ElectorateManager}
Results = list
Poll = {choose voter, vote each argument}
Argument Manager {upsert, select for upsert arguments}
Candidate Manager {upsert, select for upsert arguments}
Electorate {upsert, select for upsert arguments, list}
*/

class Sidebar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {xPosition: -props.width, setX: -props.width};
  }

	toggleMenu () {
		if (this.state.xPosition < 0) {
			this.state.xPosition = 0;
		} else {
			this.state.xPosition = -this.props.width;
		}
    this.setState(this.state);
	}

	render () {
		return (
		<div className="side-bar" style={{
			transform: `translatex(${this.state.xPosition}px)`,
			width: this.props.width,
			minHeight: "100vh" 
			}}>
      <button
          onClick={() => this.toggleMenu()}
          className="toggle-menu"
          style={{
            transform: `translate(${this.props.width}px, 20vh)`
          }}
      ></button>
      <React.Fragment>
      {this.props.children}
      </React.Fragment>
		</div>
		);
	}
}

class PollWithArgumentationView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {activeMenu: props.activeMenu}
    this.reload_data();
  }
  
  reload_data(){
    this.state.argumentation = PollWithArgumentation.singelton.getArgumentationKeys().slice();
    this.state.results = PollWithArgumentation.singelton.results();
  }
  
  handleChangeMenu(activeMenu) {
	this.state.activeMenu = activeMenu
	this.setState(this.state)
  }
  
  addElectorate(i) {
    var input = $("#electorate-name-input")[0];
    var name = input.value.trim();
    if (name !== "") {
      PollWithArgumentation.singelton.addElectorate(name);
      this.setState(this.state);
    }
    input.value = "";
  }
  
  addArgument(e, candidate) {
    var summary = $("#argument-summary-input")[0].value.trim();
    if (summary !== "") {
      PollWithArgumentation.singelton.addArgumentation(summary, candidate);
      this.refresh_results();
    }
    $("#argument-summary-input")[0].value = "";
  }
  
  addCandidate(e) {
    var summary = $("#candidate-summary-input")[0].value.trim();
    if (summary !== "") {
      PollWithArgumentation.singelton.addCandidate(summary);
      this.refresh_results();
    }
    $("#candidate-summary-input")[0].value = "";
  }
  
  load(i) {
    var file = document.getElementById('file-load-input').files[0]
    if (file) {
    	var reader = new FileReader();
      var that = this;
      reader.readAsText(file, "UTF-8");
      reader.onload = function (evt) {
          PollWithArgumentation.singelton.import_from_JSON( evt.target.result);
    			console.log(document.getElementById('file-load-input').files)
          that.refresh_results();
      }
    }
  }
  
  save (i) {
	  var json = PollWithArgumentation.singelton.export_to_JSON();
	  
	  var pom = document.createElement('a');
	  pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(json));
	  pom.setAttribute('download', 'Poll with argumentation.txt');

	  if (document.createEvent) {
		var event = document.createEvent('MouseEvents');
		event.initEvent('click', true, true);
		pom.dispatchEvent(event);
	  }
	  else {
		pom.click();
	  }
  }
  
  refresh_results(i) {
    this.reload_data();
    this.setState({
      "argumentation": this.state.argumentation,
      "results": this.state.results
    });
  }

  render() {
    return (
      <div className="poll-with-argumentation">
		<Sidebar width={300}>
          <h2 onClick={(i)=>this.handleChangeMenu("results")}>Results</h2>
          <h2 onClick={(i)=>this.handleChangeMenu("polls")}>Polls</h2>
          <h2 onClick={(i)=>this.handleChangeMenu("manager")}>Candidate Manager</h2>
          <h2 onClick={(i)=>this.handleChangeMenu("results")}>Electorate</h2>
          <h2 onClick={(i)=>this.handleChangeMenu("file")}>Load/Save</h2>
        </Sidebar>
        <PollResults
		  isActive={ this.state.activeMenu==="results" }
		  results={this.state.results}
          />
        <Poll
		  isActive={ this.state.activeMenu==="polls" }
          argumentation={this.state.argumentation}
          vote={(i) => this.vote(i)}
          refresh_results={(i) => this.refresh_results(i)}
        />
        <CandidateManager
		  isActive={ this.state.activeMenu==="manager" }
          add_argument={(i,c) => this.addArgument(i,c)}
		  add_candidate={(i) => this.addCandidate(i)}
		  argumentation={this.state.argumentation}
		    />
        <Electorate
		  isActive={ this.state.activeMenu==="electorate" }
          addElectorate={(i) => this.addElectorate(i)}
        />
        <PollFileManager
		  isActive={ this.state.activeMenu==="file" }
		  save={(i) => this.save(i)}
		  load={(i) => this.load(i)}
        />
      </div>
    );
  }
}

class PollFileManager extends React.Component {
	render() {
		return (
		<div className={(this.props.isActive)?"file":"inactive"}>
			<h2> File Management </h2>
			<button onClick={this.props.save}>save</button>
			<h3> Load </h3>
			<label htmlFor="file-load-input">file:</label>
			<input type="file"
				id="file-load-input" name="file-load-input"/>
			<button onClick={this.props.load}>load</button>
		</div>
		);
	}
}

class Poll extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentVoter: undefined
    };
  }

  update_electorate(i) {
    this.state.currentVoter = i.target.value;
    this.setState({
      "currentVoter": this.state.currentVoter
    });
  }
  
  render() {
    return (
      <div className={(this.props.isActive)?"poll":"inactive"}>
        <h2>Poll</h2>
          <div className="select_voter">
            <label>Current Voter</label>
            <select
              id="poll-electorate-input"
              name="select"
              onChange={(i) => this.update_electorate(i)}>
              { 
               PollWithArgumentation.singelton.getElectorateKeys().map((voter) => (
                <option key={voter} defaultValue={voter}
                >
                  {PollWithArgumentation.singelton.getElectorate(voter)}
                </option>
              ))}
            </select>
          </div>
          <ul>
            {this.props.argumentation.map((argument_id) => (
              <ArgumentView
			    key = {argument_id + ":" + this.state.currentVoter}
                argument={argument_id}
                refresh_results={this.props.refresh_results}
                voter={this.state.currentVoter}/>
            ))}
          </ul>
      </div>
    );
  }
}

class CandidateManager extends React.Component {
  
  render() {
    return (
      <div className={(this.props.isActive)?"candidate_manager":"inactive"}>
          <UpsertArguments
            add_argument={this.props.add_argument}
            />
          <AddCandidate
            add_candidate={this.props.add_candidate}
            />
      </div>
    );
  }
}

class PollResults extends React.Component {
  render() {
    return (
      <div className={(this.props.isActive)?"poll-results":"inactive"}>
        <h2>{PollWithArgumentation.singelton.title} Results</h2>
        <ul>
          {Object.keys(this.props.results).map((candidate_id) =>(
            <li key={"result-" + candidate_id + ":" + this.props.results[candidate_id]}>
              <span>
                {PollWithArgumentation.singelton.getCandidate(candidate_id)} ({this.props.results[candidate_id]})
              </span>
            </li>
            ))}
        </ul>
      </div>
    );
  }
}

class UpsertArguments extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentCandidate: undefined
    };
  }
  
  upsert_argument (i) {
	  return this.props.add_argument(i,this.state.currentCandidate)
  }
  
  updateCandidate(i) {
	  this.setState({currentCandidate: i.target.value});
  }

  render() {
    return (
      <div className="argument-list">
        <h3>Adding Arguments</h3>
        <div className="new-argument">
          <label>summary</label>
          <input id="argument-summary-input"></input>
          <label>candidate</label>
          <select
            id="argument-candidate-input"
            name="select"
            value={this.state.currentCandidate}
			onChange={(i)=>this.updateCandidate(i)}
          >
            {PollWithArgumentation.singelton.getCandidateKeys().map((candidate_id) => (
              <option
				key={candidate_id}
                value={candidate_id}
              >
                {PollWithArgumentation.singelton.getCandidate(candidate_id)}
              </option>
            ))}
          </select>
          <button onClick={(i)=>this.upsert_argument(i)}>add argument</button>
        </div>
      </div>
    );
  }
}

class AddCandidate extends React.Component {
  render() {
    return (
      <div className="new-candidate">
        <h3>New Candidate</h3>
          <label>summary</label>
          <input id="candidate-summary-input"></input>
          <button onClick={this.props.add_candidate}>add candidate</button>
      </div>
    );
  }
}

class Electorate extends React.Component {
  render() {
    return (
      <div className={(this.props.isActive)?"electorate":"inactive"}>
        <h2>Electorate</h2>
        <label>Name</label>
        <input id="electorate-name-input"></input>
        <button onClick={this.props.addElectorate}>add electorate</button>
        <ul>
          {PollWithArgumentation.singelton.getElectorateKeys().map((electorate_id) => (
            <li key={electorate_id}>
              <span id={"electorate-" + electorate_id}>{PollWithArgumentation.singelton.getElectorate(electorate_id)}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

class ArgumentView extends React.Component {
  constructor(props) {
    super(props);
    this.reload_data(props.argument, props.voter);
  }
  
  reload_data(argument, voter) {
    this.state = {
      data: PollWithArgumentation.singelton.getArgumentation(argument),
      id: argument,
      voter: voter
    };
    if (this.state.data !== undefined && this.state.data.votes.hasOwnProperty(this.state.voter)) {
      this.state.my_vote = this.state.data.votes[voter]
    }
    else {
      this.state.my_vote = 0;
    }
      
    if (this.state.data !== undefined) {
      this.state.candidate_summary = PollWithArgumentation.singelton.getCandidate(this.state.data.candidate_id)
    }
  }

  vote_single(i) {
    var electorate_id = $("#poll-electorate-input")[0].value;
    PollWithArgumentation.singelton.vote(
      electorate_id,
      i.target.id,
      i.target.value);
    this.reload_data(i.target.id, electorate_id)
    this.setState(this.state)
    this.props.refresh_results(i)
  }
  
  render() {
    return (
      <li className="argument">
        <input
          id={this.state.id}
          type="Number"
          min="0" max="10"
          onChange={(i)=>this.vote_single(i)}
          value={this.state.my_vote}></input>
        <strong>{this.state.data.summary}</strong> <span>{this.state.candidate_summary}</span>
      </li>
    );
  }

}

// ========================================

PollWithArgumentation.singelton.addCandidate("Candidate A")
                               .addCandidate("Candidate B")
                               .addCandidate("Candidate C");

PollWithArgumentation.singelton.addElectorate("Joe Bloggs")
                               .addElectorate("Jean Doe")
                               .addElectorate("John Connor");

PollWithArgumentation.singelton.addArgumentation('gut feelings', 'candidate-a')
                               .addArgumentation("lorem ipsum", 'candidate-a')
                               .addArgumentation("sianamet lorem", 'candidate-b');

ReactDOM.render(
  <PollWithArgumentationView activeMenu="polls" />,
  document.getElementById("root")
);





// =================HTML=============
//<div id="root"></div>
//===================================
// =================CSS==============
/*
.inactive{
  display: none;
}

.side-bar {
  display: flex;
  flex-direction: column;
  position: fixed;
  z-index: 1;
  background-color: #111;
  padding-top: 60px;
  height: 100% !important;
    border-right: 1px solid;
    border-radius: 0;
    border-color: rgba(64, 194, 133, 0.693);
    background-color: rgb(255, 255, 255);
    transition: 0.8s ease;
}

.toggle-menu {
    height: 50px;
    border-top-right-radius: 10rem;
    border-bottom-right-radius: 9rem;
    width: 10px;
    position: absolute;
    outline: none;
    z-index: 1;
    background-color: rgba(64, 194, 133, 0.693);
    border-color: rgba(64, 194, 133, 0.693);
    border-left: 0;
}
*/